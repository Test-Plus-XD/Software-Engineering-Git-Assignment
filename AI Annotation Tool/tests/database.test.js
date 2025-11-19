import { expect } from 'chai';
import { executeQuery, executeModification, getSingleRow } from '../server/database.js';

/// Unit tests for database operations
/// These tests verify that database queries work correctly without requiring HTTP requests
/// Tests use the actual SQLite database to ensure real-world accuracy
describe('Database Operations', () => {

    /// Test suite for the executeQuery function
    /// This function retrieves data from the database
    describe('executeQuery', () => {

        /// Test that the function successfully retrieves all images
        it('should retrieve all images from the database', async () => {
            const query = 'SELECT * FROM images';
            const results = await executeQuery(query);

            // Results should be an array (even if empty)
            expect(results).to.be.an('array');
            console.log(`Retrieved ${results.length} images from database`);
        });

        /// Test that the function handles invalid queries gracefully
        it('should reject queries with invalid SQL syntax', async () => {
            const invalidQuery = 'SELECT * FORM images'; // 'FORM' instead of 'FROM'

            try {
                await executeQuery(invalidQuery);
                // If we reach here, the test should fail because an error should have been thrown
                expect.fail('Query should have thrown an error');
            } catch (error) {
                // Verify that an error was thrown as expected
                expect(error).to.exist;
                console.log('Invalid query correctly rejected:', error.message);
            }
        });

        /// Test that parameterised queries work correctly and prevent SQL injection
        it('should safely handle parameterised queries', async () => {
            const query = 'SELECT * FROM images WHERE filename = ?';
            const parameters = ['test-image.jpg'];
            const results = await executeQuery(query, parameters);

            expect(results).to.be.an('array');
            console.log(`Parameterised query returned ${results.length} results`);
        });
    });

    /// Test suite for the executeModification function
    /// This function handles INSERT, UPDATE, and DELETE operations
    describe('executeModification', () => {

        let testLabelId = null;

        /// Test creating a new label in the database
        it('should insert a new label and return the last inserted ID', async () => {
            const insertQuery = 'INSERT INTO labels (label_name, label_description) VALUES (?, ?)';
            const parameters = ['test_label', 'A label created during unit testing'];

            const result = await executeModification(insertQuery, parameters);

            // Verify that the result contains the last inserted ID
            expect(result).to.have.property('lastId');
            expect(result.lastId).to.be.a('number');
            expect(result.lastId).to.be.greaterThan(0);

            // Store the ID for cleanup
            testLabelId = result.lastId;
            console.log(`Test label created with ID: ${testLabelId}`);
        });

        /// Test updating an existing record
        it('should update an existing label and return the number of changes', async () => {
            if (!testLabelId) {
                console.log('Skipping update test: No test label ID available');
                return;
            }

            const updateQuery = 'UPDATE labels SET label_description = ? WHERE label_id = ?';
            const parameters = ['Updated description', testLabelId];

            const result = await executeModification(updateQuery, parameters);

            // Verify that the result indicates one row was changed
            expect(result).to.have.property('changes');
            expect(result.changes).to.equal(1);
            console.log(`Test label ${testLabelId} updated successfully`);
        });

        /// Test deleting a record (cleanup)
        it('should delete the test label', async () => {
            if (!testLabelId) {
                console.log('Skipping delete test: No test label ID available');
                return;
            }

            const deleteQuery = 'DELETE FROM labels WHERE label_id = ?';
            const result = await executeModification(deleteQuery, [testLabelId]);

            // Verify that one row was deleted
            expect(result.changes).to.equal(1);
            console.log(`Test label ${testLabelId} deleted successfully`);
        });
    });

    /// Test suite for the getSingleRow function
    /// This function retrieves a single row, which is more efficient for specific lookups
    describe('getSingleRow', () => {

        /// Test retrieving a single label by name
        it('should retrieve a single label by name', async () => {
            // First create a test label
            const insertResult = await executeModification(
                'INSERT INTO labels (label_name) VALUES (?)',
                ['single_row_test']
            );
            const testId = insertResult.lastId;

            // Now retrieve it using getSingleRow
            const row = await getSingleRow(
                'SELECT * FROM labels WHERE label_name = ?',
                ['single_row_test']
            );

            // Verify the row was found and has the expected properties
            expect(row).to.not.be.null;
            expect(row).to.have.property('label_id');
            expect(row.label_name).to.equal('single_row_test');
            console.log('Single row retrieved successfully:', row);

            // Cleanup
            await executeModification('DELETE FROM labels WHERE label_id = ?', [testId]);
        });

        /// Test that null is returned when no row matches
        it('should return null when no row matches the query', async () => {
            const row = await getSingleRow(
                'SELECT * FROM labels WHERE label_name = ?',
                ['nonexistent_label_xyz']
            );

            expect(row).to.be.null;
            console.log('Correctly returned null for non-existent row');
        });
    });

    /// Test suite for database constraints and relationships
    describe('Database Constraints', () => {

        /// Test that foreign key constraints are enforced
        it('should enforce foreign key constraints on annotations', async () => {
            const invalidImageId = 999999;
            const invalidLabelId = 999999;

            try {
                // Attempt to create an annotation with non-existent image and label IDs
                await executeModification(
                    'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
                    [invalidImageId, invalidLabelId, 1.0]
                );

                expect.fail('Foreign key constraint should have been violated');
            } catch (error) {
                // Verify that the constraint violation error occurred
                expect(error).to.exist;
                expect(error.message).to.include('FOREIGN KEY constraint');
                console.log('Foreign key constraint correctly enforced');
            }
        });

        /// Test that unique constraints prevent duplicate annotations
        it('should prevent duplicate annotations (same image and label)', async () => {
            // First create a test label and verify we have at least one image
            const labelResult = await executeModification(
                'INSERT INTO labels (label_name) VALUES (?)',
                ['duplicate_test']
            );
            const testLabelId = labelResult.lastId;

            const images = await executeQuery('SELECT image_id FROM images LIMIT 1');

            if (images.length === 0) {
                console.log('Skipping duplicate test: No images in database');
                await executeModification('DELETE FROM labels WHERE label_id = ?', [testLabelId]);
                return;
            }

            const testImageId = images[0].image_id;

            // Create first annotation
            await executeModification(
                'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
                [testImageId, testLabelId, 1.0]
            );

            try {
                // Attempt to create duplicate annotation
                await executeModification(
                    'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
                    [testImageId, testLabelId, 0.9]
                );

                expect.fail('Unique constraint should have been violated');
            } catch (error) {
                expect(error).to.exist;
                expect(error.message).to.include('UNIQUE constraint');
                console.log('Unique constraint correctly enforced');
            } finally {
                // Cleanup
                await executeModification(
                    'DELETE FROM annotations WHERE image_id = ? AND label_id = ?',
                    [testImageId, testLabelId]
                );
                await executeModification('DELETE FROM labels WHERE label_id = ?', [testLabelId]);
            }
        });
    });
});