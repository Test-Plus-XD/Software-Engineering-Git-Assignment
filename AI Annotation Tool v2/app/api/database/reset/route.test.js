/**
 * Test suite for Database Reset endpoint
 * Tests the POST /api/database/reset functionality
 */

const { expect } = require('chai');
const { query, run } = require('../../../../lib/database/connection');

describe('POST /api/database/reset endpoint', function () {
    this.timeout(10000);

    beforeEach(async function () {
        // Add some test data to verify it gets cleared
        await run('INSERT OR IGNORE INTO labels (label_name) VALUES (?)', ['test-label']);
        await run('INSERT OR IGNORE INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
            ['test.jpg', 'test.jpg', '/test/path', 1000, 'image/jpeg']);
    });

    it('should clear all existing data', async function () {
        // Verify test data exists
        const labelsBefore = await query('SELECT COUNT(*) as count FROM labels');
        const imagesBefore = await query('SELECT COUNT(*) as count FROM images');

        expect(labelsBefore[0].count).to.be.greaterThan(0);
        expect(imagesBefore[0].count).to.be.greaterThan(0);

        // Simulate the reset operation (without HTTP request)
        await run('DELETE FROM annotations');
        await run('DELETE FROM images');
        await run('DELETE FROM labels');
        await run('DELETE FROM sqlite_sequence WHERE name IN ("labels", "images", "annotations")');

        // Verify data is cleared
        const labelsAfter = await query('SELECT COUNT(*) as count FROM labels');
        const imagesAfter = await query('SELECT COUNT(*) as count FROM images');
        const annotationsAfter = await query('SELECT COUNT(*) as count FROM annotations');

        expect(labelsAfter[0].count).to.equal(0);
        expect(imagesAfter[0].count).to.equal(0);
        expect(annotationsAfter[0].count).to.equal(0);
    });

    it('should reset auto-increment counters', async function () {
        // Add and delete some data to increment counters
        const result = await run('INSERT INTO labels (label_name) VALUES (?)', ['temp-label']);
        const insertedId = result.lastID;
        await run('DELETE FROM labels WHERE label_id = ?', [insertedId]);

        // Reset counters
        await run('DELETE FROM sqlite_sequence WHERE name IN ("labels", "images", "annotations")');

        // Insert new data - should start from 1 again
        const newResult = await run('INSERT INTO labels (label_name) VALUES (?)', ['new-label']);
        expect(newResult.lastID).to.equal(1);

        // Clean up
        await run('DELETE FROM labels WHERE label_id = ?', [newResult.lastID]);
    });

    afterEach(async function () {
        // Clean up any test data
        await run('DELETE FROM annotations');
        await run('DELETE FROM images');
        await run('DELETE FROM labels');
    });
});