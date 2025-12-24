/**
 * Export current database data to a seed file
 * This creates a complete snapshot of the database for testing and seeding
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'annotations.db');
const db = new Database(dbPath);

console.log('Exporting current database data to seed file...\n');

// Fetch all data
const labels = db.prepare('SELECT * FROM labels ORDER BY label_id').all();
const images = db.prepare('SELECT * FROM images ORDER BY image_id').all();
const annotations = db.prepare('SELECT * FROM annotations ORDER BY annotation_id').all();

console.log(`Found ${labels.length} labels, ${images.length} images, ${annotations.length} annotations\n`);

// Generate SQL seed file
let sqlContent = `-- Complete Database Seed File
-- Generated from current database state on ${new Date().toISOString()}
-- This file contains all labels, images, and annotations for testing

-- ============================================================
-- LABELS
-- ============================================================
-- Insert all label definitions
INSERT OR IGNORE INTO labels (label_id, label_name, label_description, created_at) VALUES\n`;

const labelRows = labels.map((label, index) => {
  const desc = label.label_description ? `'${label.label_description.replace(/'/g, "''")}'` : 'NULL';
  const created = label.created_at ? `'${label.created_at}'` : 'CURRENT_TIMESTAMP';
  return `    (${label.label_id}, '${label.label_name}', ${desc}, ${created})${index === labels.length - 1 ? ';' : ','}`;
});

sqlContent += labelRows.join('\n');

sqlContent += `

-- ============================================================
-- IMAGES
-- ============================================================
-- Insert all image records with Firebase Storage URLs
INSERT OR IGNORE INTO images (image_id, filename, original_name, file_path, file_size, mime_type, uploaded_at, updated_at) VALUES\n`;

const imageRows = images.map((img, index) => {
  const originalName = img.original_name ? `'${img.original_name.replace(/'/g, "''")}'` : 'NULL';
  const uploaded = img.uploaded_at ? `'${img.uploaded_at}'` : 'CURRENT_TIMESTAMP';
  const updated = img.updated_at ? `'${img.updated_at}'` : 'CURRENT_TIMESTAMP';
  return `    (${img.image_id}, '${img.filename}', ${originalName}, '${img.file_path}', ${img.file_size}, '${img.mime_type}', ${uploaded}, ${updated})${index === images.length - 1 ? ';' : ','}`;
});

sqlContent += imageRows.join('\n');

sqlContent += `

-- ============================================================
-- ANNOTATIONS
-- ============================================================
-- Insert all annotations (image-label relationships with confidence scores)
INSERT OR IGNORE INTO annotations (annotation_id, image_id, label_id, confidence, created_at) VALUES\n`;

const annotationRows = annotations.map((ann, index) => {
  const created = ann.created_at ? `'${ann.created_at}'` : 'CURRENT_TIMESTAMP';
  return `    (${ann.annotation_id}, ${ann.image_id}, ${ann.label_id}, ${ann.confidence}, ${created})${index === annotations.length - 1 ? ';' : ','}`;
});

sqlContent += annotationRows.join('\n');

sqlContent += `

-- ============================================================
-- SUMMARY
-- ============================================================
-- Total records:
--   Labels: ${labels.length}
--   Images: ${images.length}
--   Annotations: ${annotations.length}
--
-- This seed file provides a complete snapshot of the database
-- and can be used for testing and development environments.
`;

// Write to file
const outputPath = path.join(__dirname, '002_complete_snapshot.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log(`✓ Seed file created: ${outputPath}`);
console.log('\nSummary:');
console.log(`  - ${labels.length} labels`);
console.log(`  - ${images.length} images`);
console.log(`  - ${annotations.length} annotations`);

// Also create a JSON version for programmatic access
const jsonData = {
  generated_at: new Date().toISOString(),
  labels,
  images,
  annotations
};

const jsonOutputPath = path.join(__dirname, '002_complete_snapshot.json');
fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log(`✓ JSON version created: ${jsonOutputPath}`);

db.close();
console.log('\n✓ Export complete!');
