import express from 'express';
import { executeQuery, executeModification, getSingleRow } from '../database.js';

/// Express router for handling all label-related API endpoints
/// Labels are reusable tags that can be applied to multiple images
/// This router provides CRUD operations for managing the label library
const router = express.Router();

/// GET /API/labels - Retrieve all available labels
/// This endpoint returns all labels in the system along with statistics
/// about how many images each label is applied to
router.get('/', async (request, response) => {
    try {
        console.log('[GET] /API/labels - Fetching all labels');

        // Query joins labels with annotations to count usage
        // LEFT JOIN ensures labels with zero images are still returned
        const query = `
      SELECT 
        l.label_id,
        l.label_name,
        l.label_description,
        l.created_at,
        COUNT(a.annotation_id) as usage_count
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      GROUP BY l.label_id
      ORDER BY l.label_name ASC
    `;

        const labels = await executeQuery(query);

        const transformedLabels = labels.map(label => ({
            labelId: label.label_id,
            labelName: label.label_name,
            labelDescription: label.label_description,
            createdAt: label.created_at,
            usageCount: label.usage_count
        }));

        console.log(`[GET] /API/labels - Returned ${transformedLabels.length} labels`);
        response.json({ count: transformedLabels.length, data: transformedLabels });
    } catch (error) {
        console.error('[ERROR] /API/labels - Failed to retrieve labels:', error);
        response.status(500).json({ error: 'Failed to retrieve labels' });
    }
});

/// GET /API/labels/:id - Retrieve a single label by its ID
/// Returns detailed information about the label including all images it's applied to
router.get('/:id', async (request, response) => {
    try {
        const labelId = Number.parseInt(request.params.id);
        console.log(`[GET] /API/labels/${labelId} - Fetching label details`);

        if (Number.isNaN(labelId)) {
            return response.status(400).json({ error: 'Invalid label ID' });
        }

        // Get the label record
        const label = await getSingleRow('SELECT * FROM labels WHERE label_id = ?', [labelId]);

        if (!label) {
            console.log(`[GET] /API/labels/${labelId} - Label not found`);
            return response.status(404).json({ error: 'Label not found' });
        }

        // Get all images that have this label
        const imagesQuery = `
      SELECT i.image_id, i.filename, i.original_name, a.confidence, a.created_at
      FROM images i
      INNER JOIN annotations a ON i.image_id = a.image_id
      WHERE a.label_id = ?
      ORDER BY a.created_at DESC
    `;
        const images = await executeQuery(imagesQuery, [labelId]);

        const labelData = {
            labelId: label.label_id,
            labelName: label.label_name,
            labelDescription: label.label_description,
            createdAt: label.created_at,
            images: images.map(image => ({
                imageId: image.image_id,
                filename: image.filename,
                originalName: image.original_name,
                confidence: image.confidence,
                annotatedAt: image.created_at
            }))
        };

        console.log(`[GET] /API/labels/${labelId} - Success`);
        response.json(labelData);
    } catch (error) {
        console.error(`[ERROR] /API/labels/${request.params.id} - Failed to retrieve label:`, error);
        response.status(500).json({ error: 'Failed to retrieve label' });
    }
});

/// POST /API/labels - Create a new label
/// This allows users to pre-create labels before applying them to images
/// Useful for establishing a consistent labelling taxonomy
router.post('/', async (request, response) => {
    try {
        const { labelName, labelDescription } = request.body;
        console.log(`[POST] /API/labels - Creating label: ${labelName}`);

        if (!labelName) {
            return response.status(400).json({ error: 'Label name is required' });
        }

        // Check if label already exists to prevent duplicates
        const existingLabel = await getSingleRow('SELECT label_id FROM labels WHERE label_name = ?', [labelName]);

        if (existingLabel) {
            console.log(`[POST] /API/labels - Label already exists: ${labelName}`);
            return response.status(409).json({
                error: 'Label already exists',
                labelId: existingLabel.label_id
            });
        }

        // Insert the new label
        const insertQuery = 'INSERT INTO labels (label_name, label_description) VALUES (?, ?)';
        const result = await executeModification(insertQuery, [labelName, labelDescription || null]);

        console.log(`[POST] /API/labels - Label created with ID: ${result.lastId}`);
        response.status(201).json({
            labelId: result.lastId,
            labelName: labelName,
            message: 'Label created successfully'
        });
    } catch (error) {
        console.error('[ERROR] /API/labels - Failed to create label:', error);
        response.status(500).json({ error: 'Failed to create label' });
    }
});

/// PUT /API/labels/:id - Update an existing label
/// Allows modification of label name and description
/// Note: Changing the label name affects all images that use this label
router.put('/:id', async (request, response) => {
    try {
        const labelId = Number.parseInt(request.params.id);
        const { labelName, labelDescription } = request.body;
        console.log(`[PUT] /API/labels/${labelId} - Updating label`);

        if (Number.isNaN(labelId)) {
            return response.status(400).json({ error: 'Invalid label ID' });
        }

        if (!labelName) {
            return response.status(400).json({ error: 'Label name is required' });
        }

        // Verify the label exists
        const existingLabel = await getSingleRow('SELECT label_id FROM labels WHERE label_id = ?', [labelId]);

        if (!existingLabel) {
            console.log(`[PUT] /API/labels/${labelId} - Label not found`);
            return response.status(404).json({ error: 'Label not found' });
        }

        // Check if the new name conflicts with another label
        const nameConflict = await getSingleRow(
            'SELECT label_id FROM labels WHERE label_name = ? AND label_id != ?',
            [labelName, labelId]
        );

        if (nameConflict) {
            return response.status(409).json({ error: 'Another label with this name already exists' });
        }

        // Update the label
        const updateQuery = 'UPDATE labels SET label_name = ?, label_description = ? WHERE label_id = ?';
        await executeModification(updateQuery, [labelName, labelDescription || null, labelId]);

        console.log(`[PUT] /API/labels/${labelId} - Label updated successfully`);
        response.status(204).send();
    } catch (error) {
        console.error(`[ERROR] /API/labels/${request.params.id} - Failed to update label:`, error);
        response.status(500).json({ error: 'Failed to update label' });
    }
});

/// DELETE /API/labels/:id - Delete a label
/// This also removes all annotations using this label due to CASCADE delete
/// Use with caution as this affects multiple images
router.delete('/:id', async (request, response) => {
    try {
        const labelId = Number.parseInt(request.params.id);
        console.log(`[DELETE] /API/labels/${labelId} - Deleting label`);

        if (Number.isNaN(labelId)) {
            return response.status(400).json({ error: 'Invalid label ID' });
        }

        // Check how many images use this label before deletion
        const usageCheck = await getSingleRow(
            'SELECT COUNT(*) as count FROM annotations WHERE label_id = ?',
            [labelId]
        );

        const result = await executeModification('DELETE FROM labels WHERE label_id = ?', [labelId]);

        if (result.changes === 0) {
            console.log(`[DELETE] /API/labels/${labelId} - Label not found`);
            return response.status(404).json({ error: 'Label not found' });
        }

        console.log(`[DELETE] /API/labels/${labelId} - Label deleted (affected ${usageCheck.count} annotations)`);
        response.status(204).send();
    } catch (error) {
        console.error(`[ERROR] /API/labels/${request.params.id} - Failed to delete label:`, error);
        response.status(500).json({ error: 'Failed to delete label' });
    }
});

export default router;