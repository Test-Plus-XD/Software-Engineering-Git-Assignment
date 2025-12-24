/**
 * Database Migration Runner
 * Applies database schema changes to existing databases
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function runMigrations() {
    const dbPath = path.join(process.cwd(), 'database', 'annotations.db');

    // Check if database exists
    if (!fs.existsSync(dbPath)) {
        console.log('Database does not exist yet. Migrations will be applied when database is created.');
        return;
    }

    const db = new Database(dbPath);

    try {
        // Enable foreign keys
        db.pragma('foreign_keys = ON');

        console.log('Running database migrations...');

        // Check if migration has already been applied
        const tableInfo = db.prepare("PRAGMA table_info(images)").all();
        const hasCreatedBy = tableInfo.some(col => col.name === 'created_by');

        if (!hasCreatedBy) {
            console.log('Applying migration: add_creator_editor_fields');

            // Read and execute migration
            const migrationPath = path.join(__dirname, 'migrations', 'add_creator_editor_fields.sql');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

            // Split by semicolon and execute each statement
            const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

            db.transaction(() => {
                for (const statement of statements) {
                    if (statement.trim()) {
                        db.exec(statement);
                    }
                }
            })();

            console.log('Migration completed successfully');
        } else {
            console.log('Migration already applied, skipping');
        }

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };