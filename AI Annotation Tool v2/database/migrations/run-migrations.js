/**
 * Database Migration Runner for AI Annotation Tool v2
 * Implements a robust migration system with tracking, rollback, and validation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, query, queryOne, run, transaction, getDatabase } = require('../../lib/database/connection');

const MIGRATIONS_DIR = __dirname;

/**
 * Create the migrations tracking table
 */
function createMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checksum TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
  `;
  
  exec(sql);
  console.log('Migrations table created successfully');
}

/**
 * Record a migration as applied
 * @param {Object} migrationData - Migration metadata
 */
function recordMigration(migrationData) {
  const { version, name, checksum } = migrationData;
  
  run(
    'INSERT INTO migrations (version, name, checksum) VALUES (?, ?, ?)',
    [version, name, checksum]
  );
}

/**
 * Get all migration files sorted by version
 * @returns {Array} Array of migration file paths
 */
function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql') && file.match(/^\d{3}_.*\.sql$/))
    .sort((a, b) => {
      const versionA = parseInt(a.substring(0, 3));
      const versionB = parseInt(b.substring(0, 3));
      return versionA - versionB;
    });
  
  return files.map(file => path.join(MIGRATIONS_DIR, file));
}

/**
 * Get list of applied migration versions
 * @returns {Array} Array of applied version strings
 */
function getAppliedMigrations() {
  try {
    const migrations = query('SELECT version FROM migrations ORDER BY version');
    return migrations.map(m => m.version);
  } catch (error) {
    // Migrations table doesn't exist yet
    return [];
  }
}

/**
 * Calculate checksum for a file
 * @param {string} filePath - Path to the file
 * @returns {string} MD5 checksum
 */
function calculateChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Validate migration file naming convention
 * @param {string} fileName - Migration file name
 * @returns {boolean} True if valid
 */
function validateMigrationFileName(fileName) {
  const pattern = /^\d{3}_[a-zA-Z0-9_]+\.sql$/;
  return pattern.test(fileName);
}

/**
 * Check for duplicate migration versions
 * @param {Array} files - Array of migration file names
 */
function checkForDuplicateVersions(files) {
  const versions = new Set();
  
  for (const file of files) {
    const version = file.substring(0, 3);
    if (versions.has(version)) {
      throw new Error(`Duplicate migration version: ${version}`);
    }
    versions.add(version);
  }
}

/**
 * Validate migration checksum against recorded checksum
 * @param {string} version - Migration version
 * @param {string} currentChecksum - Current file checksum
 */
function validateMigrationChecksum(version, currentChecksum) {
  const recorded = queryOne(
    'SELECT checksum FROM migrations WHERE version = ?',
    [version]
  );
  
  if (recorded && recorded.checksum !== currentChecksum) {
    throw new Error(`Migration file has been modified after application: ${version}`);
  }
}

/**
 * Parse migration file name to extract version and name
 * @param {string} fileName - Migration file name
 * @returns {Object} Parsed migration info
 */
function parseMigrationFileName(fileName) {
  const baseName = path.basename(fileName, '.sql');
  const version = baseName.substring(0, 3);
  const name = baseName.substring(4);
  
  return { version, name };
}

/**
 * Run all pending migrations
 * @returns {Object} Migration results
 */
function runMigrations() {
  console.log('Starting database migrations...');
  
  // Ensure migrations table exists
  createMigrationsTable();
  
  const migrationFiles = getMigrationFiles();
  const appliedMigrations = getAppliedMigrations();
  
  // Validate file names
  const fileNames = migrationFiles.map(f => path.basename(f));
  fileNames.forEach(fileName => {
    if (!validateMigrationFileName(fileName)) {
      throw new Error(`Invalid migration file name: ${fileName}`);
    }
  });
  
  // Check for duplicates
  checkForDuplicateVersions(fileNames);
  
  const results = {
    applied: [],
    skipped: [],
    errors: []
  };
  
  // Process each migration in a transaction
  return transaction(() => {
    for (const migrationFile of migrationFiles) {
      const fileName = path.basename(migrationFile);
      const { version, name } = parseMigrationFileName(fileName);
      
      // Skip if already applied
      if (appliedMigrations.includes(version)) {
        console.log(`Skipping migration ${fileName} (already applied)`);
        results.skipped.push(fileName);
        continue;
      }
      
      try {
        console.log(`Applying migration: ${fileName}`);
        
        // Calculate checksum
        const checksum = calculateChecksum(migrationFile);
        
        // Validate checksum if migration was previously applied
        validateMigrationChecksum(version, checksum);
        
        // Read and execute migration SQL
        const sql = fs.readFileSync(migrationFile, 'utf8');
        exec(sql);
        
        // Record migration as applied
        recordMigration({ version, name, checksum });
        
        results.applied.push(fileName);
        console.log(`✓ Applied migration: ${fileName}`);
        
      } catch (error) {
        const errorMsg = `Migration failed: ${fileName} - ${error.message}`;
        console.error(errorMsg);
        results.errors.push({ file: fileName, error: error.message });
        throw new Error(errorMsg);
      }
    }
    
    return results;
  });
}

/**
 * Get migration status information
 * @returns {Object} Migration status
 */
function getMigrationStatus() {
  const migrationFiles = getMigrationFiles();
  const appliedMigrations = getAppliedMigrations();
  
  const totalMigrations = migrationFiles.length;
  const appliedCount = appliedMigrations.length;
  
  const lastApplied = appliedCount > 0 ? 
    queryOne('SELECT * FROM migrations ORDER BY applied_at DESC LIMIT 1') : 
    null;
  
  return {
    totalMigrations,
    appliedMigrations: appliedMigrations,
    pendingMigrations: getPendingMigrations(),
    lastApplied: lastApplied
  };
}

/**
 * Get pending migrations
 * @returns {Array} Array of pending migration info
 */
function getPendingMigrations() {
  const migrationFiles = getMigrationFiles();
  const appliedMigrations = getAppliedMigrations();
  
  return migrationFiles
    .filter(file => {
      const { version } = parseMigrationFileName(path.basename(file));
      return !appliedMigrations.includes(version);
    })
    .map(file => {
      const { version, name } = parseMigrationFileName(path.basename(file));
      return { version, name, file: path.basename(file) };
    });
}

/**
 * Initialize migration system and run all pending migrations
 */
async function initializeMigrations() {
  try {
    console.log('Initializing migration system...');
    
    const results = runMigrations();
    
    console.log('\n=== Migration Results ===');
    console.log(`Applied: ${results.applied.length} migrations`);
    console.log(`Skipped: ${results.skipped.length} migrations`);
    console.log(`Errors: ${results.errors.length} migrations`);
    
    if (results.applied.length > 0) {
      console.log('\nApplied migrations:');
      results.applied.forEach(file => console.log(`  ✓ ${file}`));
    }
    
    if (results.skipped.length > 0) {
      console.log('\nSkipped migrations:');
      results.skipped.forEach(file => console.log(`  - ${file}`));
    }
    
    if (results.errors.length > 0) {
      console.log('\nFailed migrations:');
      results.errors.forEach(({ file, error }) => console.log(`  ✗ ${file}: ${error}`));
      throw new Error('Some migrations failed');
    }
    
    console.log('\n✅ Migration system initialized successfully');
    return results;
    
  } catch (error) {
    console.error('❌ Migration initialization failed:', error.message);
    throw error;
  }
}

// Export functions for testing and external use
module.exports = {
  createMigrationsTable,
  recordMigration,
  getMigrationFiles,
  getAppliedMigrations,
  validateMigrationFileName,
  checkForDuplicateVersions,
  validateMigrationChecksum,
  runMigrations,
  getMigrationStatus,
  getPendingMigrations,
  initializeMigrations
};

// Run migrations if this script is called directly
if (require.main === module) {
  initializeMigrations()
    .then(() => {
      console.log('Migration process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}