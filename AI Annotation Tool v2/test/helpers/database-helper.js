/**
 * Database test helpers
 * Utility functions for database testing with better-sqlite3
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class DatabaseHelper {
  constructor() {
    this.db = null;
    this.testDbPath = path.join(process.cwd(), 'database', 'test-annotations.db');
  }

  async setup() {
    // Create test database
    this.db = new Database(this.testDbPath);
    this.db.pragma('foreign_keys = ON');

    // Initialize schema
    await this.initializeSchema();
  }

  async cleanup() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Remove test database file
    if (fs.existsSync(this.testDbPath)) {
      fs.unlinkSync(this.testDbPath);
    }
  }

  async initializeSchema() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS images (
        image_id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS labels (
        label_id INTEGER PRIMARY KEY AUTOINCREMENT,
        label_name TEXT UNIQUE NOT NULL,
        label_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS annotations (
        annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id INTEGER NOT NULL,
        label_id INTEGER NOT NULL,
        confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_annotations_image ON annotations(image_id);
      CREATE INDEX IF NOT EXISTS idx_annotations_label ON annotations(label_id);
      CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);
      CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(label_name);
    `);
  }

  // Image methods
  async getImageById(imageId) {
    const stmt = this.db.prepare('SELECT * FROM images WHERE image_id = ?');
    return stmt.get(imageId);
  }

  async getAllImages() {
    const stmt = this.db.prepare('SELECT * FROM images ORDER BY uploaded_at DESC');
    return stmt.all();
  }

  async createImageWithFirebaseUrl(imageData) {
    const stmt = this.db.prepare(`
      INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      imageData.filename,
      imageData.original_name,
      imageData.file_path,
      imageData.file_size,
      imageData.mime_type
    );
    return result.lastInsertRowid;
  }

  // Label methods
  async getLabelByName(labelName) {
    const stmt = this.db.prepare('SELECT * FROM labels WHERE label_name = ?');
    return stmt.get(labelName);
  }

  async getAllLabels() {
    const stmt = this.db.prepare('SELECT * FROM labels ORDER BY label_name');
    return stmt.all();
  }

  async createLabel(labelName, description = null) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO labels (label_name, label_description)
      VALUES (?, ?)
    `);
    const result = stmt.run(labelName, description);
    return result.lastInsertRowid;
  }

  // Annotation methods
  async getImageLabels(imageId) {
    const stmt = this.db.prepare(`
      SELECT l.label_name as name, a.confidence
      FROM annotations a
      JOIN labels l ON a.label_id = l.label_id
      WHERE a.image_id = ?
      ORDER BY a.confidence DESC
    `);
    return stmt.all(imageId);
  }

  async createAnnotation(imageId, labelId, confidence) {
    const stmt = this.db.prepare(`
      INSERT INTO annotations (image_id, label_id, confidence)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(imageId, labelId, confidence);
    return result.lastInsertRowid;
  }

  // Statistics and utility methods
  getDatabaseStats() {
    const stats = {};

    try {
      const imageCount = this.db.prepare('SELECT COUNT(*) as count FROM images').get();
      const labelCount = this.db.prepare('SELECT COUNT(*) as count FROM labels').get();
      const annotationCount = this.db.prepare('SELECT COUNT(*) as count FROM annotations').get();

      stats.images = imageCount.count;
      stats.labels = labelCount.count;
      stats.annotations = annotationCount.count;

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  cleanupTestData() {
    try {
      // Remove test annotations first (due to foreign key constraints)
      this.db.prepare(`DELETE FROM annotations WHERE annotation_id IN (
        SELECT a.annotation_id FROM annotations a
        JOIN images i ON a.image_id = i.image_id
        WHERE i.filename LIKE 'test-%' OR i.filename LIKE 'annotation-test%'
      )`).run();

      // Remove test images
      this.db.prepare("DELETE FROM images WHERE filename LIKE 'test-%' OR filename LIKE 'annotation-test%'").run();

      // Remove test labels
      this.db.prepare("DELETE FROM labels WHERE label_name LIKE 'test-%' OR label_name LIKE 'annotation-test%'").run();

      console.log('Test data cleanup completed');
    } catch (error) {
      console.error('Error during test data cleanup:', error);
    }
  }

  createSampleTestData() {
    try {
      // Create test image
      const imageResult = this.db.prepare(
        'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)'
      ).run(['test-sample.jpg', 'sample.jpg', 'public/uploads/test-sample.jpg', 150000, 'image/jpeg']);

      // Create test label
      const labelResult = this.db.prepare(
        'INSERT INTO labels (label_name, label_description) VALUES (?, ?)'
      ).run(['test-sample-label', 'Sample label for testing']);

      // Create test annotation
      const annotationResult = this.db.prepare(
        'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)'
      ).run([imageResult.lastInsertRowid, labelResult.lastInsertRowid, 0.85]);

      return {
        imageId: imageResult.lastInsertRowid,
        labelId: labelResult.lastInsertRowid,
        annotationId: annotationResult.lastInsertRowid
      };
    } catch (error) {
      console.error('Error creating sample test data:', error);
      throw error;
    }
  }

  verifySchemaIntegrity() {
    const issues = [];

    try {
      // Check if all required tables exist
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      const tableNames = tables.map(t => t.name);

      const requiredTables = ['images', 'labels', 'annotations'];
      requiredTables.forEach(table => {
        if (!tableNames.includes(table)) {
          issues.push(`Missing required table: ${table}`);
        }
      });

      // Check if all required indexes exist
      const indexes = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `).all();
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
      const fkCheck = this.db.prepare('PRAGMA foreign_key_check').all();
      if (fkCheck.length > 0) {
        issues.push(`Foreign key constraint violations: ${fkCheck.length}`);
      }

      return issues;
    } catch (error) {
      issues.push(`Schema verification error: ${error.message}`);
      return issues;
    }
  }
}

// Legacy exports for backward compatibility
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
  DatabaseHelper,
  cleanupTestData,
  getDatabaseStats,
  createSampleTestData,
  verifySchemaIntegrity
};