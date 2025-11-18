import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const currentFileUrl = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFileUrl);

// Path to the SQLite database file
// This creates a file in the database directory two levels up
const databasePath = join(currentDirectory, '../../database/annotations.db');

/// Initialises and returns a connection to the SQLite database
/// This uses verbose mode for better error messages during development
const database = new sqlite3.Database(databasePath, (error) => {
    if (error) {
        console.error('Failed to connect to SQLite database:', error.message);
        throw error;
    }
    console.log('Successfully connected to SQLite database');
});

/// Wrapper function that converts callback-based sqlite3 methods to Promises
/// This makes it much easier to use async/await syntax in your route handlers
/// @param {string} query - The SQL query to execute
/// @param {Array} parameters - Array of parameters to safely insert into the query
/// @returns {Promise} - Resolves with query results
const executeQuery = (query, parameters = []) => {
    return new Promise((resolve, reject) => {
        database.all(query, parameters, (error, rows) => {
            if (error) {
                console.error('Query execution error:', error.message);
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
};

/// Executes a query that modifies data (INSERT, UPDATE, DELETE)
/// Returns information about the operation rather than rows
/// @param {string} query - The SQL query to execute
/// @param {Array} parameters - Array of parameters for the query
/// @returns {Promise} - Resolves with operation metadata (lastID, changes)
const executeModification = (query, parameters = []) => {
    return new Promise((resolve, reject) => {
        database.run(query, parameters, function (error) {
            if (error) {
                console.error('Modification error:', error.message);
                reject(error);
            } else {
                // 'this' context contains lastID and changes
                resolve({ lastId: this.lastID, changes: this.changes });
            }
        });
    });
};

export { database, executeQuery, executeModification };