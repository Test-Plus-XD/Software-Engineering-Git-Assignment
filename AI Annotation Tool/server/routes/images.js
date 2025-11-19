import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { executeQuery, executeModification } from '../database.js';
import fs from 'fs/promises';

const router = express.Router();

// Setup for handling file uploads
const currentFileUrl = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFileUrl);
const uploadDirectory = path.join(currentDirectory, '../../uploads/images');

/// Configure multer for handling image uploads
/// This middleware handles multipart/form-data which is used for file uploads
const storage = multer.diskStorage({
    destination: async (request, file, callback) => {
        // Ensure the upload directory exists
        try {
            await fs.mkdir(uploadDirectory, { recursive: true });
            callback(null, uploadDirectory);
        } catch (error) {
            callback(error);
        }
    },
    filename: (request, file, callback) => {
        // Generate unique filename using timestamp and random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        callback(null, `image-${uniqueSuffix}${fileExtension}`);
    }
});

/// File filter to accept only image files
/// This is a security measure to prevent users uploading malicious files
const fileFilter = (request, file, callback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/// GET /API/images - Retrieve all images with their labels
router.get('/', async (request, response) => {
    try {
        // This query uses LEFT JOIN to get images even if they have no labels
        // The GROUP_CONCAT function combines multiple labels into a single string
        const query = `
      SELECT 
        i.image_id,
        i.filename,
        i.original_name,
        i.file_path,
        i.file_size,
        i.mime_type,
        i.uploaded_at,
        GROUP_CONCAT(l.label_name) as label_names
      FROM images i
      LEFT JOIN annotations a ON i.image_id = a.image_id
      LEFT JOIN labels l ON a.label_id = l.label_id
      GROUP BY i.image_id
      ORDER BY i.uploaded_at DESC
    `;

        const images = await executeQuery(query);

        // Transform the label_names string into an array
        const transformedImages = images.map(image => ({
            ...image,
            labels: image.label_names ? image.label_names.split(',') : []
        }));

        response.json({ count: transformedImages.length, data: transformedImages });
    } catch (error) {
        console.error('Error retrieving images:', error);
        response.status(500).json({ error: 'Failed to retrieve images' });
    }
});

/// GET /API/images/:id - Retrieve a single image with its labels
router.get('/:id', async (request, response) => {
    try {
        const imageId = Number.parseInt(request.params.id);

        if (Number.isNaN(imageId)) {
            return response.status(400).json({ error: 'Invalid image ID' });
        }

        // Get image details
        const imageQuery = `SELECT * FROM images WHERE image_id = ?`;
        const images = await executeQuery(imageQuery, [imageId]);

        if (images.length === 0) {
            return response.status(404).json({ error: 'Image not found' });
        }

        // Get associated labels
        const labelsQuery = `
      SELECT l.label_id, l.label_name, a.confidence
      FROM labels l
      INNER JOIN annotations a ON l.label_id = a.label_id
      WHERE a.image_id = ?
    `;
        const labels = await executeQuery(labelsQuery, [imageId]);

        const imageData = {
            ...images[0],
            labels: labels
        };

        response.json(imageData);
    } catch (error) {
        console.error('Error retrieving image:', error);
        response.status(500).json({ error: 'Failed to retrieve image' });
    }
});

/// POST /API/images - Upload a new image
router.post('/', upload.single('image'), async (request, response) => {
    try {
        if (!request.file) {
            return response.status(400).json({ error: 'No image file provided' });
        }

        const file = request.file;

        // Insert image record into database
        const insertQuery = `
      INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `;

        const result = await executeModification(insertQuery, [
            file.filename,
            file.originalname,
            path.posix.join('uploads/images', file.filename), // Build a web-friendly relative path (always forward slashes)
            file.size,
            file.mimetype
        ]);

        response.status(201).json({
            imageId: result.lastId,
            filename: file.filename,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        response.status(500).json({ error: 'Failed to upload image' });
    }
});

/// POST /API/images/:id/labels - Add a label to an image
router.post('/:id/labels', async (request, response) => {
    try {
        const imageId = Number.parseInt(request.params.id);
        const { labelName, confidence = 1.0 } = request.body;

        if (Number.isNaN(imageId)) {
            return response.status(400).json({ error: 'Invalid image ID' });
        }

        if (!labelName) {
            return response.status(400).json({ error: 'Label name is required' });
        }

        // Check if image exists
        const imageCheck = await executeQuery('SELECT image_id FROM images WHERE image_id = ?', [imageId]);
        if (imageCheck.length === 0) {
            return response.status(404).json({ error: 'Image not found' });
        }

        // Insert or get existing label
        let labelId;
        const existingLabel = await executeQuery('SELECT label_id FROM labels WHERE label_name = ?', [labelName]);

        if (existingLabel.length > 0) {
            labelId = existingLabel[0].label_id;
        } else {
            const labelResult = await executeModification('INSERT INTO labels (label_name) VALUES (?)', [labelName]);
            labelId = labelResult.lastId;
        }

        // Create annotation
        try {
            await executeModification(
                'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
                [imageId, labelId, confidence]
            );

            response.status(201).json({ message: 'Label added successfully', labelId: labelId });
        } catch (error) {
            // Handle duplicate annotation (image already has this label)
            if (error.message.includes('UNIQUE constraint')) {
                return response.status(409).json({ error: 'This label is already applied to the image' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error adding label:', error);
        response.status(500).json({ error: 'Failed to add label' });
    }
});

/// DELETE /API/images/:id - Delete an image and its annotations
router.delete('/:id', async (request, response) => {
    try {
        const imageId = Number.parseInt(request.params.id);

        if (Number.isNaN(imageId)) {
            return response.status(400).json({ error: 'Invalid image ID' });
        }

        // Get image file path before deletion
        const images = await executeQuery('SELECT file_path FROM images WHERE image_id = ?', [imageId]);

        if (images.length === 0) {
            return response.status(404).json({ error: 'Image not found' });
        }

        // Delete from database (CASCADE will handle annotations)
        await executeModification('DELETE FROM images WHERE image_id = ?', [imageId]);

        // Delete physical file
        try {
            await fs.unlink(images[0].file_path);
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue even if file deletion fails
        }

        response.status(204).send();
    } catch (error) {
        console.error('Error deleting image:', error);
        response.status(500).json({ error: 'Failed to delete image' });
    }
});

export default router;