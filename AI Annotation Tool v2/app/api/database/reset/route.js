/**
 * API route for resetting the database
 * Deletes all data and re-seeds with sample data
 */

import { NextResponse } from 'next/server';
import { run, exec } from '../../../../lib/database/connection.js';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/database/reset - Reset database with seed data
 */
export async function POST(request) {
    try {
        console.log('Starting database reset...');

        // Clear all existing data (in reverse order due to foreign key constraints)
        await run('DELETE FROM annotations');
        await run('DELETE FROM images');
        await run('DELETE FROM labels');

        console.log('Existing data cleared');

        // Reset auto-increment counters
        await run('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?)', ['labels', 'images', 'annotations']);

        console.log('Auto-increment counters reset');

        // Re-seed with sample data
        const seedPath = path.join(process.cwd(), 'database', 'seeds', '001_sample_data.sql');

        if (fs.existsSync(seedPath)) {
            const seedData = fs.readFileSync(seedPath, 'utf8');
            exec(seedData);
            console.log('Sample data seeded successfully');
        } else {
            console.warn('Seed file not found, database reset without seeding');
        }

        return NextResponse.json({
            success: true,
            message: 'Database reset successfully with sample data'
        });

    } catch (error) {
        console.error('Database reset failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to reset database',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/database/reset - Get reset status (for testing)
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Database reset endpoint is available',
        methods: ['POST']
    });
}