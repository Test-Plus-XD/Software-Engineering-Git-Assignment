/**
 * Data Access Layer for Annotations
 * Handles all database operations for image annotations
 */

const proxy = require('../database/proxy');
const { query, queryOne, run } = require('../database/connection');

/**
 * Update annotation confidence
 * @param {number} imageId - Image ID
 * @param {number} labelId - Label ID
 * @param {number} confidence - New confidence value (0-1)
 * @param {string} userEmail - User who is making the update
 * @returns {Object} Updated annotation
 */
async function updateAnnotationConfidence(imageId, labelId, confidence, userEmail = 'anonymous') {
    try {
        // Validate confidence range
        if (confidence < 0 || confidence > 1) {
            throw new Error('Confidence must be between 0 and 1');
        }

        return proxy.transaction(() => {
            // Check if annotation exists
            const existing = queryOne(`
                SELECT * FROM annotations
                WHERE image_id = ? AND label_id = ?
            `, [imageId, labelId]);

            if (!existing) {
                throw new Error('Annotation not found');
            }

            // Update confidence and last_edited_by using run() for UPDATE statements
            run(`
                UPDATE annotations
                SET confidence = ?, last_edited_by = ?
                WHERE image_id = ? AND label_id = ?
            `, [confidence, userEmail, imageId, labelId]);

            // Return updated annotation
            return queryOne(`
                SELECT * FROM annotations
                WHERE image_id = ? AND label_id = ?
            `, [imageId, labelId]);
        });
    } catch (error) {
        console.error('Error updating annotation confidence:', error);
        throw new Error(`Failed to update annotation: ${error.message}`);
    }
}

/**
 * Delete an annotation
 * @param {number} imageId - Image ID
 * @param {number} labelId - Label ID
 * @returns {boolean} Success status
 */
async function deleteAnnotation(imageId, labelId) {
    try {
        return proxy.transaction(() => {
            // Check if annotation exists
            const existing = queryOne(`
                SELECT * FROM annotations
                WHERE image_id = ? AND label_id = ?
            `, [imageId, labelId]);

            if (!existing) {
                return false;
            }

            // Delete annotation using run() for DELETE statements
            run(`
                DELETE FROM annotations
                WHERE image_id = ? AND label_id = ?
            `, [imageId, labelId]);

            return true;
        });
    } catch (error) {
        console.error('Error deleting annotation:', error);
        throw new Error(`Failed to delete annotation: ${error.message}`);
    }
}

/**
 * Create a new annotation
 * @param {number} imageId - Image ID
 * @param {number} labelId - Label ID
 * @param {number} confidence - Confidence value (0-1), defaults to 1.0
 * @param {string} userEmail - User who is creating the annotation
 * @returns {Object} Created annotation
 */
async function createAnnotation(imageId, labelId, confidence = 1.0, userEmail = 'anonymous') {
    try {
        // Validate confidence range
        if (confidence < 0 || confidence > 1) {
            throw new Error('Confidence must be between 0 and 1');
        }

        return proxy.transaction(() => {
            // Check for duplicate
            const existing = queryOne(`
                SELECT * FROM annotations
                WHERE image_id = ? AND label_id = ?
            `, [imageId, labelId]);

            if (existing) {
                throw new Error('Annotation already exists for this image and label');
            }

            // Create annotation with creator tracking using run() for INSERT statements
            run(`
                INSERT INTO annotations (image_id, label_id, confidence, created_by)
                VALUES (?, ?, ?, ?)
            `, [imageId, labelId, confidence, userEmail]);

            // Get the created annotation
            return queryOne(`
                SELECT * FROM annotations
                WHERE image_id = ? AND label_id = ?
            `, [imageId, labelId]);
        });
    } catch (error) {
        console.error('Error creating annotation:', error);
        if (error.message.includes('UNIQUE constraint') || error.message.includes('already exists')) {
            throw new Error('Annotation already exists for this image and label');
        }
        throw new Error(`Failed to create annotation: ${error.message}`);
    }
}

/**
 * Get all annotations for an image
 * @param {number} imageId - Image ID
 * @returns {Array} Annotations with label details
 */
async function getAnnotationsByImage(imageId) {
    try {
        const annotations = query(`
            SELECT
                a.annotation_id,
                a.image_id,
                a.label_id,
                a.confidence,
                a.created_at,
                a.created_by,
                a.last_edited_by,
                l.label_name,
                l.label_description
            FROM annotations a
            JOIN labels l ON a.label_id = l.label_id
            WHERE a.image_id = ?
            ORDER BY a.created_at DESC
        `, [imageId]);

        return annotations;
    } catch (error) {
        console.error('Error getting annotations by image:', error);
        throw new Error(`Failed to get annotations: ${error.message}`);
    }
}

/**
 * Get label ID by label name (helper function)
 * @param {string} labelName - Label name
 * @returns {number|null} Label ID or null if not found
 */
function getLabelIdByName(labelName) {
    try {
        const label = queryOne(`
            SELECT label_id FROM labels WHERE label_name = ?
        `, [labelName]);

        return label ? label.label_id : null;
    } catch (error) {
        console.error('Error getting label ID by name:', error);
        return null;
    }
}

module.exports = {
    updateAnnotationConfidence,
    deleteAnnotation,
    createAnnotation,
    getAnnotationsByImage,
    getLabelIdByName
};
