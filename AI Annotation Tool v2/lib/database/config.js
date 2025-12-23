/**
 * Database Configuration Module for AI Annotation Tool v2
 * Centralizes database settings, paths, and connection parameters
 */

const path = require('path');
const fs = require('fs');

/**
 * Database configuration object
 */
const config = {
  // Database file paths
  paths: {
    // Main database path (can be overridden by environment)
    main: process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'annotations.db'),
    
    // Test database path (used during testing)
    test: process.env.TEST_DB_PATH || path.join(process.cwd(), 'database', 'test_annotations.db'),
    
    // Backup database path
    backup: process.env.BACKUP_DB_PATH || path.join(process.cwd(), 'database', 'annotations_backup.db'),
    
    // Directory containing database files
    directory: path.join(process.cwd(), 'database')
  },
  
  // Connection settings
  connection: {
    // Enable foreign key constraints
    foreignKeys: true,
    
    // WAL mode for better concurrency (Write-Ahead Logging)
    walMode: process.env.NODE_ENV === 'production',
    
    // Connection timeout in milliseconds
    timeout: parseInt(process.env.DB_TIMEOUT) || 5000,
    
    // Enable verbose logging in development
    verbose: process.env.NODE_ENV === 'development' && process.env.DB_VERBOSE === 'true'
  },
  
  // Performance settings
  performance: {
    // Cache size in KB (-1 for default)
    cacheSize: parseInt(process.env.DB_CACHE_SIZE) || -1,
    
    // Synchronous mode (FULL, NORMAL, OFF)
    synchronous: process.env.DB_SYNCHRONOUS || 'FULL',
    
    // Journal mode (DELETE, TRUNCATE, PERSIST, MEMORY, WAL, OFF)
    journalMode: process.env.DB_JOURNAL_MODE || 'DELETE'
  },
  
  // Migration settings
  migrations: {
    // Directory containing migration files
    directory: path.join(process.cwd(), 'database', 'migrations'),
    
    // Migration file pattern
    filePattern: /^\d{3}_[a-zA-Z0-9_]+\.sql$/,
    
    // Table name for tracking migrations
    tableName: 'migrations'
  },
  
  // Backup settings
  backup: {
    // Enable automatic backups
    enabled: process.env.DB_BACKUP_ENABLED === 'true',
    
    // Backup interval in milliseconds (default: 24 hours)
    interval: parseInt(process.env.DB_BACKUP_INTERVAL) || 24 * 60 * 60 * 1000,
    
    // Maximum number of backup files to keep
    maxBackups: parseInt(process.env.DB_MAX_BACKUPS) || 7
  }
};

/**
 * Get the appropriate database path based on environment
 * @returns {string} Database file path
 */
function getDatabasePath() {
  // Test environment
  if (process.env.NODE_ENV === 'test' || process.env.TEST_DB_PATH) {
    return config.paths.test;
  }
  
  // Production/development environment
  return config.paths.main;
}

/**
 * Ensure database directory exists
 * @param {string} dbPath - Database file path
 */
function ensureDatabaseDirectory(dbPath) {
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    } catch (error) {
      throw new Error(`Failed to create database directory: ${error.message}`);
    }
  }
}

/**
 * Validate database configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfig() {
  const dbPath = getDatabasePath();
  
  // Check if database directory is writable
  const dbDir = path.dirname(dbPath);
  
  try {
    // Ensure directory exists
    ensureDatabaseDirectory(dbPath);
    
    // Test write permissions
    const testFile = path.join(dbDir, '.write_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
  } catch (error) {
    throw new Error(`Database directory is not writable: ${dbDir} - ${error.message}`);
  }
  
  // Validate timeout
  if (config.connection.timeout < 1000) {
    console.warn('Database timeout is very low, this may cause connection issues');
  }
  
  // Validate cache size
  if (config.performance.cacheSize !== -1 && config.performance.cacheSize < 1000) {
    console.warn('Database cache size is very low, this may impact performance');
  }
}

/**
 * Get database connection options for better-sqlite3
 * @returns {Object} Connection options
 */
function getConnectionOptions() {
  const dbPath = getDatabasePath();
  
  return {
    // Database file path
    path: dbPath,
    
    // Connection options
    options: {
      verbose: config.connection.verbose ? console.log : null,
      fileMustExist: false, // Allow creation of new database
      timeout: config.connection.timeout,
      readonly: false
    },
    
    // Pragma settings to apply after connection
    pragmas: {
      foreign_keys: config.connection.foreignKeys ? 'ON' : 'OFF',
      journal_mode: config.performance.journalMode,
      synchronous: config.performance.synchronous,
      cache_size: config.performance.cacheSize,
      ...(config.connection.walMode && { journal_mode: 'WAL' })
    }
  };
}

/**
 * Get detailed database configuration information
 * @returns {Object} Configuration details
 */
function getConfigInfo() {
  return {
    environment: process.env.NODE_ENV || 'development',
    databasePath: getDatabasePath(),
    testMode: !!(process.env.NODE_ENV === 'test' || process.env.TEST_DB_PATH),
    connectionSettings: config.connection,
    performanceSettings: config.performance,
    migrationSettings: config.migrations,
    backupSettings: config.backup
  };
}

/**
 * Check database health and connectivity
 * @param {Database} db - better-sqlite3 database instance
 * @returns {Object} Health check results
 */
function checkDatabaseHealth(db) {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    const result = db.prepare('SELECT 1 as test').get();
    if (result.test !== 1) {
      throw new Error('Basic query failed');
    }
    
    // Check foreign keys setting
    const fkResult = db.prepare('PRAGMA foreign_keys').get();
    const foreignKeysEnabled = fkResult.foreign_keys === 1;
    
    // Get database info
    const dbInfo = {
      path: getDatabasePath(),
      size: getDatabaseSize(),
      tables: getTableCount(db),
      foreignKeysEnabled,
      journalMode: db.prepare('PRAGMA journal_mode').get().journal_mode,
      synchronous: db.prepare('PRAGMA synchronous').get().synchronous
    };
    
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      responseTime,
      database: dbInfo,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get database file size in bytes
 * @returns {number} File size in bytes
 */
function getDatabaseSize() {
  const dbPath = getDatabasePath();
  
  try {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      return stats.size;
    }
    return 0;
  } catch (error) {
    console.warn('Could not get database size:', error.message);
    return -1;
  }
}

/**
 * Get number of tables in database
 * @param {Database} db - better-sqlite3 database instance
 * @returns {number} Number of tables
 */
function getTableCount(db) {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).get();
    
    return result.count;
  } catch (error) {
    console.warn('Could not get table count:', error.message);
    return -1;
  }
}

/**
 * Format database size for human reading
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatDatabaseSize(bytes) {
  if (bytes === -1) return 'Unknown';
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Create a backup of the database
 * @param {Database} db - better-sqlite3 database instance
 * @returns {string} Backup file path
 */
function createBackup(db) {
  if (!config.backup.enabled) {
    throw new Error('Database backups are disabled');
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    config.paths.directory,
    `annotations_backup_${timestamp}.db`
  );
  
  try {
    db.backup(backupPath);
    console.log(`Database backup created: ${backupPath}`);
    
    // Clean up old backups
    cleanupOldBackups();
    
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Clean up old backup files
 */
function cleanupOldBackups() {
  try {
    const backupDir = config.paths.directory;
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('annotations_backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    // Remove excess backup files
    if (files.length > config.backup.maxBackups) {
      const filesToDelete = files.slice(config.backup.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`Removed old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup old backups:', error.message);
  }
}

module.exports = {
  config,
  getDatabasePath,
  ensureDatabaseDirectory,
  validateConfig,
  getConnectionOptions,
  getConfigInfo,
  checkDatabaseHealth,
  getDatabaseSize,
  formatDatabaseSize,
  createBackup,
  cleanupOldBackups
};