import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Get the directory name of the current module for ES module compatibility
const currentFileUrl = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFileUrl);

// Construct the path to the SQLite database file
// This creates the database in the database directory at the project root
const databasePath = join(currentDirectory, '../database/annotations.db');
const schemaPath = join(currentDirectory, '../database/schema.sql');

/// Initialises and returns a connection to the SQLite database
/// Uses verbose mode to provide detailed error messages during development
/// The database file will be created automatically if it doesn't exist
const database = new(sqlite3.verbose().Database)(databasePath, (error) => {
    if (error) {
        console.error('Failed to connect to SQLite database:', error.message);
        throw error;
    }
    console.log('✅ Successfully connected to SQLite database');
    console.log(`   Database location: ${databasePath}`);

    // Initialise the database schema if tables don't exist
    initialiseSchema();
});

/// Initialises the database schema by reading and executing the schema.sql file
/// This function checks if tables exist and creates them if they don't
/// It only runs once when the server starts to ensure the database structure is correct
async function initialiseSchema() {
    try {
        // Check if tables already exist by querying the sqlite_master table
        const tables = await executeQuery(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='images'"
        );

        // If the images table exists, we assume all tables are set up
        if (tables.length > 0) {
            console.log('📊 Database schema already exists');
            return;
        }

        console.log('📝 Initialising database schema...');

        // Read the schema SQL file
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');

        // Split the schema into individual statements (separated by semicolons)
        const statements = schemaContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);

        // Execute each statement sequentially
        for (const statement of statements) {
            await executeModification(statement);
        }

        console.log('✅ Database schema initialised successfully');
    } catch (error) {
        console.error('❌ Failed to initialise database schema:', error);
        throw error;
    }
}

/// Wrapper function that converts callback-based sqlite3 methods to Promises
/// This allows us to use modern async/await syntax instead of callbacks
/// The 'all' method retrieves all matching rows from the query result
/// @param {string} query - The SQL query to execute
/// @param {Array} parameters - Array of parameters to safely insert into the query (prevents SQL injection)
/// @returns {Promise<Array>} - Resolves with an array of result rows
const executeQuery = (query, parameters = []) => {
    return new Promise((resolve, reject) => {
        database.all(query, parameters, (error, rows) => {
            if (error) {
                console.error('Query execution error:', error.message);
                console.error('Query:', query);
                console.error('Parameters:', parameters);
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
};

/// Executes a query that modifies data (INSERT, UPDATE, DELETE)
/// Unlike executeQuery, this returns metadata about the operation rather than rows
/// The 'run' method is used for operations that change data
/// @param {string} query - The SQL query to execute
/// @param {Array} parameters - Array of parameters for the query
/// @returns {Promise<Object>} - Resolves with operation metadata including lastID (for INSERT) and changes (number of affected rows)
const executeModification = (query, parameters = []) => {
    return new Promise((resolve, reject) => {
        database.run(query, parameters, function (error) {
            if (error) {
                console.error('Modification error:', error.message);
                console.error('Query:', query);
                console.error('Parameters:', parameters);
                reject(error);
            } else {
                // The 'this' context in the callback contains useful metadata
                // lastID: the rowid of the last inserted row (for INSERT statements)
                // changes: the number of rows affected by the query
                resolve({
                    lastId: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
};

/// Retrieves a single row from the database
/// This is more efficient than executeQuery when you only need one result
/// Often used for retrieving specific records by ID
/// @param {string} query - The SQL query to execute
/// @param {Array} parameters - Array of parameters for the query
/// @returns {Promise<Object|null>} - Resolves with a single row object or null if not found
const getSingleRow = (query, parameters = []) => {
    return new Promise((resolve, reject) => {
        database.get(query, parameters, (error, row) => {
            if (error) {
                console.error('Get single row error:', error.message);
                console.error('Query:', query);
                console.error('Parameters:', parameters);
                reject(error);
            } else {
                resolve(row || null);
            }
        });
    });
};

/// Closes the database connection gracefully
/// This should be called when shutting down the server to ensure all pending operations complete
/// and database files are properly closed
function closeDatabase() {
    return new Promise((resolve, reject) => {
        database.close((error) => {
            if (error) {
                console.error('Error closing database:', error.message);
                reject(error);
            } else {
                console.log('Database connection closed');
                resolve();
            }
        });
    });
}

// Graceful shutdown handlers to ensure database is properly closed
// These handlers catch process termination signals and close the database before exiting
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT signal, closing database...');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM signal, closing database...');
    await closeDatabase();
    process.exit(0);
});

export { database, executeQuery, executeModification, getSingleRow, closeDatabase };