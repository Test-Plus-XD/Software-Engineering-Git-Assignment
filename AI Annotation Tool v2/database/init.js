/**
 * Database initialization script for AI Annotation Tool v2
 * This script sets up the SQLite database with schema and sample data using better-sqlite3
 */

const fs = require('fs');
const path = require('path');
const { exec, databaseExists, getDatabasePath } = require('../lib/database/connection');

const SCHEMA_PATH = path.join(__dirname, '..', 'lib', 'database', 'schema.sql');
const SEEDS_DIR = path.join(__dirname, 'seeds');

/**
 * Initialize the database with schema and seed data
 */
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    console.log('Database path:', getDatabasePath());

    // Read and execute schema
    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      console.log('Executing database schema...');
      exec(schema);
      console.log('Schema created successfully');
    } else {
      throw new Error(`Schema file not found: ${SCHEMA_PATH}`);
    }

    // Run seed files if they exist
    if (fs.existsSync(SEEDS_DIR)) {
      const seedFiles = fs.readdirSync(SEEDS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of seedFiles) {
        const seedPath = path.join(SEEDS_DIR, file);
        const seed = fs.readFileSync(seedPath, 'utf8');
        
        console.log(`Running seed: ${file}`);
        exec(seed);
        console.log(`Seed ${file} completed successfully`);
      }
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;
  }
}

// Run initialization if this script is called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database setup failed:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };