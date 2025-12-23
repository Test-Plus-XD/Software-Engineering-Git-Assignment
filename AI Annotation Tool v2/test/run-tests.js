#!/usr/bin/env node

/**
 * Test runner script for AI Annotation Tool v2
 * Ensures database is initialized before running tests
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'database', 'annotations.db');

function ensureDatabaseExists() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('Database not found. Initializing...');
    
    const { initializeDatabase } = require('../database/init');
    try {
      initializeDatabase();
      console.log('Database initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  } else {
    console.log('Database found. Proceeding with tests...');
  }
}

function runTests() {
  ensureDatabaseExists();
  
  // Run Mocha tests
  const mocha = spawn('npx', ['mocha', 'test/**/*.test.js', '--timeout', '10000'], {
    stdio: 'inherit',
    shell: true
  });

  mocha.on('close', (code) => {
    console.log(`\nTests completed with exit code: ${code}`);
    process.exit(code);
  });

  mocha.on('error', (error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

// Run if called directly
if (require.main === module) {
  try {
    runTests();
  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
}

module.exports = { runTests, ensureDatabaseExists };