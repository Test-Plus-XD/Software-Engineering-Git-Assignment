/**
 * Database test helpers
 * Utility functions for database testing with better-sqlite3
 */

const fs = require('fs');
const path = require('path');
const { query, run } = require('../../lib/database/connection');

/**
 * Clean up test data by removing records with specific patterns
 */
function cleanupTestData() {
  try {
    // Remove test annotations first (due to foreign key constraints)
    run(`DELETE FROM annotations WHERE annotation_id IN (
      SELECT a.annotation_id FROM annotations a
      JOIN images i ON a.image_id = i.image_id
      WHERE i.filename LIKE 'test-%' OR i.filename LIKE 'annotation-test%'
    )`);

    // Remove test images
    run("DELETE FROM images WHERE filename LIKE 'test-%' OR filename LIKE 'annotation-test%'");

    // Remove test labels
    run("DELETE FROM labels WHERE label_name LIKE 'test-%' OR label_name LIKE 'annotation-test%'");

    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error during test data cleanup:', error);
  }
}

/**
 * Get database statistics for testing
 */
function getDatabaseStats() {
  const stats = {};
  
  try {
    const imageCount = query('SELECT COUNT(*) as count FROM images');
    const labelCount = query('SELECT COUNT(*) as count FROM labels');
    const annotationCount = query('SELECT COUNT(*) as count FROM annotations');

    stats.images = imageCount[0].count;
    stats.labels = labelCount[0].count;
    stats.annotations = annotationCount[0].count;

    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

/**
 * Create sample test data
 */
function createSampleTestData() {
  try {
    // Create test image
    const imageResult = run(
      'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
      ['test-sample.jpg', 'sample.jpg', 'public/uploads/test-sample.jpg', 150000, 'image/jpeg']
    );

    // Create test label
    const labelResult = run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      ['test-sample-label', 'Sample label for testing']
    );

    // Create test annotation
    const annotationResult = run(
      'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
      [imageResult.lastID, labelResult.lastID, 0.85]
    );

    return {
      imageId: imageResult.lastID,
      labelId: labelResult.lastID,
      annotationId: annotationResult.lastID
    };
  } catch (error) {
    console.error('Error creating sample test data:', error);
    throw error;
  }
}

/**
 * Verify database schema integrity
 */
function verifySchemaIntegrity() {
  const issues = [];

  try {
    // Check if all required tables exist
    const tables = query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const tableNames = tables.map(t => t.name);
    
    const requiredTables = ['images', 'labels', 'annotations'];
    requiredTables.forEach(table => {
      if (!tableNames.includes(table)) {
        issues.push(`Missing required table: ${table}`);
      }
    });

    // Check if all required indexes exist
    const indexes = query(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `);
    const indexNames = indexes.map(i => i.name);
    
    const requiredIndexes = [
      'idx_annotations_label',
      'idx_annotations_image', 
      'idx_images_filename',
      'idx_labels_name'
    ];
    requiredIndexes.forEach(index => {
      if (!indexNames.includes(index)) {
        issues.push(`Missing required index: ${index}`);
      }
    });

    // Check foreign key constraints
    const fkCheck = query('PRAGMA foreign_key_check');
    if (fkCheck.length > 0) {
      issues.push(`Foreign key constraint violations: ${fkCheck.length}`);
    }

    return issues;
  } catch (error) {
    issues.push(`Schema verification error: ${error.message}`);
    return issues;
  }
}

module.exports = {
  cleanupTestData,
  getDatabaseStats,
  createSampleTestData,
  verifySchemaIntegrity
};