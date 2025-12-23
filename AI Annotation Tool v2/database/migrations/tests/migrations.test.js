/**
 * Migration System Tests for AI Annotation Tool v2
 * These tests verify the database migration system functionality
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Database Migration System Tests', function() {
  this.timeout(10000);

  // Use isolated test environment
  const ORIGINAL_TEST_PATH = process.env.TEST_DB_PATH;
  const TEST_DB_PATH = path.join(__dirname, '..', '..', '..', 'database', 'migration_test.db');

  before(function() {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // Set isolated test database path
    process.env.TEST_DB_PATH = TEST_DB_PATH;
  });

  after(function() {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // Restore original test database path
    if (ORIGINAL_TEST_PATH) {
      process.env.TEST_DB_PATH = ORIGINAL_TEST_PATH;
    } else {
      delete process.env.TEST_DB_PATH;
    }
  });

  describe('Migration System Components', function() {
    it('should have run-migrations.js module', function() {
      const migrationPath = path.join(__dirname, '..', 'run-migrations.js');
      expect(fs.existsSync(migrationPath)).to.be.true;
    });

    it('should export required migration functions', function() {
      const migrations = require('../run-migrations');
      
      expect(migrations).to.have.property('createMigrationsTable');
      expect(migrations).to.have.property('runMigrations');
      expect(migrations).to.have.property('getMigrationStatus');
      expect(migrations).to.have.property('getMigrationFiles');
      expect(migrations).to.have.property('getAppliedMigrations');
      
      expect(migrations.createMigrationsTable).to.be.a('function');
      expect(migrations.runMigrations).to.be.a('function');
      expect(migrations.getMigrationStatus).to.be.a('function');
    });
  });

  describe('Migration Tracking', function() {
    let migrations;

    before(function() {
      migrations = require('../run-migrations');
    });

    it('should create migrations tracking table', function() {
      const { query } = require('../../../lib/database/connection');
      
      migrations.createMigrationsTable();
      
      const tables = query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='migrations'
      `);
      
      expect(tables).to.have.length(1);
      expect(tables[0].name).to.equal('migrations');
    });

    it('should have correct migrations table structure', function() {
      const { query } = require('../../../lib/database/connection');
      
      const columns = query(`PRAGMA table_info(migrations)`);
      const columnNames = columns.map(col => col.name);
      
      expect(columnNames).to.include.members([
        'migration_id',
        'version',
        'name',
        'applied_at',
        'checksum'
      ]);
    });
  });

  describe('Migration File Handling', function() {
    let migrations;

    before(function() {
      migrations = require('../run-migrations');
    });

    it('should find migration files', function() {
      const files = migrations.getMigrationFiles();
      expect(files).to.be.an('array');
      
      // Should find at least the initial schema migration
      expect(files.length).to.be.at.least(1);
      
      // Files should be sorted by version
      const fileNames = files.map(f => path.basename(f));
      expect(fileNames[0]).to.match(/^001_.*\.sql$/);
    });

    it('should validate migration file names', function() {
      expect(migrations.validateMigrationFileName('001_initial_schema.sql')).to.be.true;
      expect(migrations.validateMigrationFileName('123_add_feature.sql')).to.be.true;
      
      expect(migrations.validateMigrationFileName('invalid.sql')).to.be.false;
      expect(migrations.validateMigrationFileName('1_no_padding.sql')).to.be.false;
    });
  });

  describe('Migration Execution', function() {
    let migrations;

    before(function() {
      migrations = require('../run-migrations');
    });

    it('should run migrations successfully', function() {
      const result = migrations.runMigrations();
      
      expect(result).to.have.property('applied');
      expect(result).to.have.property('skipped');
      expect(result).to.have.property('errors');
      
      expect(result.applied).to.be.an('array');
      expect(result.skipped).to.be.an('array');
      expect(result.errors).to.be.an('array');
      
      // Should have applied at least the initial migration
      expect(result.applied.length + result.skipped.length).to.be.at.least(1);
    });

    it('should provide migration status', function() {
      const status = migrations.getMigrationStatus();
      
      expect(status).to.have.property('totalMigrations');
      expect(status).to.have.property('appliedMigrations');
      expect(status).to.have.property('pendingMigrations');
      
      expect(status.totalMigrations).to.be.a('number');
      expect(status.appliedMigrations).to.be.an('array');
      expect(status.pendingMigrations).to.be.an('array');
    });

    it('should be idempotent (safe to run multiple times)', function() {
      // Run migrations first time
      const firstRun = migrations.runMigrations();
      
      // Run migrations second time - should skip all
      const secondRun = migrations.runMigrations();
      
      expect(secondRun.applied).to.have.length(0);
      expect(secondRun.skipped.length).to.be.greaterThan(0);
    });
  });

  describe('Database State After Migration', function() {
    it('should have all required tables', function() {
      const { query } = require('../../../lib/database/connection');
      
      const tables = query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      const tableNames = tables.map(t => t.name);
      expect(tableNames).to.include.members(['images', 'labels', 'annotations', 'migrations']);
    });

    it('should have foreign key constraints enabled', function() {
      const { query } = require('../../../lib/database/connection');
      
      const result = query('PRAGMA foreign_keys');
      expect(result[0]).to.have.property('foreign_keys', 1);
    });
  });
});

