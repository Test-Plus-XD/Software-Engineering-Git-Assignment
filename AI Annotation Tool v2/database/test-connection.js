/**
 * Test script to verify database connection and data
 * Run with: node database/test-connection.js
 */

const { query, closeDatabase } = require('../lib/database/connection');

function testDatabase() {
  try {
    console.log('Testing database connection...\n');

    // Test 1: Count tables
    const tables = query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    console.log('✓ Tables found:', tables.map(t => t.name).join(', '));

    // Test 2: Count records in each table
    const imageCount = query('SELECT COUNT(*) as count FROM images');
    const labelCount = query('SELECT COUNT(*) as count FROM labels');
    const annotationCount = query('SELECT COUNT(*) as count FROM annotations');

    console.log(`✓ Images: ${imageCount[0].count} records`);
    console.log(`✓ Labels: ${labelCount[0].count} records`);
    console.log(`✓ Annotations: ${annotationCount[0].count} records`);

    // Test 3: Sample query with joins
    const sampleData = query(`
      SELECT 
        i.filename,
        l.label_name,
        a.confidence
      FROM images i
      JOIN annotations a ON i.image_id = a.image_id
      JOIN labels l ON a.label_id = l.label_id
      LIMIT 5
    `);

    console.log('\n✓ Sample annotations:');
    sampleData.forEach(row => {
      console.log(`  ${row.filename} -> ${row.label_name} (${row.confidence})`);
    });

    console.log('\n🎉 Database test completed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    closeDatabase();
  }
}

// Run the test
testDatabase();