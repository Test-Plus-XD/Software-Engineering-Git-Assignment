/**
 * Database connection module for AI Annotation Tool v2
 * Uses better-sqlite3 for synchronous SQLite operations with enhanced configuration
 */

const Database = require('better-sqlite3');
const { 
  getDatabasePath, 
  ensureDatabaseDirectory, 
  validateConfig, 
  getConnectionOptions,
  checkDatabaseHealth 
} = require('./config');

let db = null;

/**
 * Get database connection (singleton pattern)
 * @returns {Database} better-sqlite3 Database connection
 */
function getDatabase() {
  if (!db) {
    try {
      // Validate configuration before connecting
      validateConfig();
      
      const { path: dbPath, options, pragmas } = getConnectionOptions();
      
      // Ensure database directory exists
      ensureDatabaseDirectory(dbPath);

      // Create database connection
      db = new Database(dbPath, options.options);
      
      // Apply pragma settings
      Object.entries(pragmas).forEach(([pragma, value]) => {
        if (value !== null && value !== undefined) {
          db.pragma(`${pragma} = ${value}`);
        }
      });
      
      console.log(`Connected to SQLite database: ${dbPath}`);
      
      // Perform health check
      const health = checkDatabaseHealth(db);
      if (!health.healthy) {
        throw new Error(`Database health check failed: ${health.error}`);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Database health check passed:', {
          responseTime: `${health.responseTime}ms`,
          tables: health.database.tables,
          foreignKeys: health.database.foreignKeysEnabled
        });
      }
      
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
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
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw new Error(`Database query failed: ${error.message}`);
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
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw new Error(`Database queryOne failed: ${error.message}`);
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
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw new Error(`Database run failed: ${error.message}`);
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
    console.error('SQL:', sql);
    throw new Error(`Database exec failed: ${error.message}`);
  }
}

/**
 * Check if database file exists
 * @returns {boolean} True if database file exists
 */
function databaseExists() {
  const fs = require('fs');
  return fs.existsSync(getDatabaseFilePath());
}

/**
 * Get database file path
 * @returns {string} Database file path
 */
function getDatabaseFilePath() {
  const { getDatabasePath: getPath } = require('./config');
  return getPath();
}

/**
 * Get database connection health status
 * @returns {Object} Health check results
 */
function getDatabaseHealth() {
  try {
    const database = getDatabase();
    return checkDatabaseHealth(database);
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
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
  getDatabasePath: getDatabaseFilePath,
  getDatabaseHealth
};