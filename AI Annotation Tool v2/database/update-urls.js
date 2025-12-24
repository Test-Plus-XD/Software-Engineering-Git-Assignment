/**
 * Update existing database records with Firebase Storage URLs
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'annotations.db');
const db = new Database(dbPath);

console.log('Updating image URLs to Firebase Storage...\n');

// Update each image with its Firebase Storage URL
const updates = [
  {
    id: 1,
    filename: 'sample-cat-001.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-cat-001.jpg?alt=media&token=9789c13a-9fe9-492b-86cd-ce8018511f48'
  },
  {
    id: 2,
    filename: 'sample-dog-001.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-dog-001.jpg?alt=media&token=92137c9b-8346-48e3-ada8-0753f59cf93c'
  },
  {
    id: 3,
    filename: 'sample-landscape-001.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-landscape-001.jpg?alt=media&token=db1e3a03-bdcf-42cc-970c-0f6820328dcd'
  },
  {
    id: 4,
    filename: 'sample-person-001.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-person-001.jpg?alt=media&token=b184f9aa-5c18-4f99-a909-f61e7dfd437d'
  },
  {
    id: 5,
    filename: 'sample-food-001.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-food-001.jpg?alt=media&token=00686225-78cb-4767-bae4-e8e17e710395'
  }
];

const updateStmt = db.prepare('UPDATE images SET file_path = ? WHERE image_id = ?');

updates.forEach(({ id, filename, url }) => {
  const result = updateStmt.run(url, id);
  if (result.changes > 0) {
    console.log(`✓ Updated ${filename} (ID: ${id})`);
  } else {
    console.log(`✗ Failed to update ${filename} (ID: ${id})`);
  }
});

// Verify the updates
console.log('\nVerifying updates...\n');
const images = db.prepare('SELECT image_id, filename, file_path FROM images ORDER BY image_id').all();

images.forEach(img => {
  console.log(`ID ${img.image_id}: ${img.filename}`);
  console.log(`  URL: ${img.file_path.substring(0, 80)}...`);
  console.log('');
});

db.close();
console.log('✓ Database updated successfully!');
