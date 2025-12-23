/**
 * Database connection module for AI Annotation Tool v2
 * Uses better-sqlite3 for synchronous SQLite operations
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use test database path if in test environment
const DB_PATH = process.env.TEST_DB_PATH || path.join(process.cwd(), 'database', 'annotations.db');

let db = null;

/**
 * Get database connection (singleton pattern)
 * @returns {Database} better-sqlite3 Database connection
 */
function getDatabase() {
  if (!db) {
    // Ensure database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    console.log('Connected to SQLite database with better-sqlite3');
  }
  
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    } finally {
      db = null;
    }
  }
}

/**
 * Execute a query with parameters (SELECT statements)
 * @param {string} sql SQL query
 * @param {Array|Object} params Query parameters
 * @returns {Array} Query results
 */
function query(sql, params = []) {
  try {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    return stmt.all(params);
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * Execute a query that returns a single row
 * @param {string} sql SQL query
 * @param {Array|Object} params Query parameters
 * @returns {Object|undefined} Single row result
 */
function queryOne(sql, params = []) {
  try {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    return stmt.get(params);
  } catch (error) {
    console.error('QueryOne error:', error.message);
    throw error;
  }
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 * @param {string} sql SQL query
 * @param {Array|Object} params Query parameters
 * @returns {Object} Result with lastInsertRowid and changes
 */
function run(sql, params = []) {
  try {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    const result = stmt.run(params);
    return {
      lastID: result.lastInsertRowid,
      changes: result.changes
    };
  } catch (error) {
    console.error('Run error:', error.message);
    throw error;
  }
}

/**
 * Execute multiple statements in a transaction
 * @param {Function} callback Function containing database operations
 * @returns {*} Result of the callback function
 */
function transaction(callback) {
  const database = getDatabase();
  const txn = database.transaction(callback);
  return txn();
}

/**
 * Execute raw SQL (for schema creation, etc.)
 * @param {string} sql Raw SQL to execute
 */
function exec(sql) {
  try {
    const database = getDatabase();
    database.exec(sql);
  } catch (error) {
    console.error('Exec error:', error.message);
    throw error;
  }
}

/**
 * Check if database file exists
 * @returns {boolean} True if database file exists
 */
function databaseExists() {
  return fs.existsSync(DB_PATH);
}

/**
 * Get database file path
 * @returns {string} Database file path
 */
function getDatabasePath() {
  return DB_PATH;
}

module.exports = {
  getDatabase,
  closeDatabase,
  query,
  queryOne,
  run,
  transaction,
  exec,
  databaseExists,
  getDatabasePath
};