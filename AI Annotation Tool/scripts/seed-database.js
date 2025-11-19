import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { execScript, executeQuery } from '../server/database.js';

const currentFileUrl = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFileUrl);
const seedPath = join(currentDirectory, '../database/seed.sql');

async function seedDatabase() {
    try {
        console.log('📊 Starting database seeding...');
        console.log(`Reading seed file from: ${seedPath}`);
        const seedContent = await readFile(seedPath, 'utf-8');

        // Execute the whole SQL file in a single transaction
        await execScript(seedContent);
        console.log('✅ Seed file executed');

        // Display summary
        await displaySummary();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during database seeding:', error.message || error);
        process.exit(1);
    }
}

async function displaySummary() {
    try {
        const imageCount = (await executeQuery('SELECT COUNT(*) as count FROM images'))[0].count;
        const labelCount = (await executeQuery('SELECT COUNT(*) as count FROM labels'))[0].count;
        const annotationCount = (await executeQuery('SELECT COUNT(*) as count FROM annotations'))[0].count;
        console.log(`Images: ${imageCount}`);
        console.log(`Labels: ${labelCount}`);
        console.log(`Annotations: ${annotationCount}`);
    } catch (error) {
        console.error('Error displaying summary:', error);
    }
}

seedDatabase();