import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import imageRoutes from './routes/images.js';
import labelRoutes from './routes/labels.js';

/// Main Express server for the AI Dataset Annotation Tool
/// This server handles both serving static frontend files and providing RESTful API endpoints
/// for managing images, labels, and annotations in the SQLite database
const application = express();
const port = 3000;

// Get current directory for ES modules
const currentFileUrl = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFileUrl);

// --- Middleware Configuration ---
// Enable CORS to allow frontend to communicate with backend
application.use(cors());
// Parse incoming JSON request bodies
application.use(express.json());
// Parse URL-encoded bodies (for form submissions)
application.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
// This allows the frontend HTML, CSS, and JavaScript files to be accessed
const publicDirectory = path.join(currentDirectory, '../public');
application.use(express.static(publicDirectory));

// Serve uploaded images from the uploads directory
// This creates a route so images can be accessed via /uploads/images/filename.jpg
const uploadsDirectory = path.join(currentDirectory, '../uploads');
application.use('/uploads', express.static(uploadsDirectory));

// --- API Routes ---
// Mount the image routes under /API/images
// All routes defined in imageRoutes will be prefixed with /API/images
application.use('/API/images', imageRoutes);

// Mount the label routes under /API/labels
// All routes defined in labelRoutes will be prefixed with /API/labels
application.use('/API/labels', labelRoutes);

// --- SQLite-specific endpoint demonstration ---
// This endpoint provides information about the SQLite database
// It's a simple endpoint to verify the SQLite integration is working
application.get('/SQLite/Images', async (request, response) => {
    try {
        // Import the database query function
        const { executeQuery } = await import('./database/db.js');

        // Get basic statistics about the database
        const imageCount = await executeQuery('SELECT COUNT(*) as count FROM images');
        const labelCount = await executeQuery('SELECT COUNT(*) as count FROM labels');
        const annotationCount = await executeQuery('SELECT COUNT(*) as count FROM annotations');

        console.log(`[GET] /SQLite/Images - Database statistics retrieved`);

        response.json({
            database: 'SQLite',
            status: 'connected',
            statistics: {
                totalImages: imageCount[0].count,
                totalLabels: labelCount[0].count,
                totalAnnotations: annotationCount[0].count
            },
            message: 'SQLite database is operational'
        });
    } catch (error) {
        console.error('[ERROR] /SQLite/Images - Failed to retrieve database statistics:', error);
        response.status(500).json({ error: 'Failed to retrieve database information' });
    }
});

// --- Root endpoint ---
// Redirect root URL to the main application page
application.get('/', (request, response) => {
    response.sendFile(path.join(publicDirectory, 'index.html'));
});

// --- Error handling middleware ---
// This catches any errors that occur during request processing
// It should be defined after all other middleware and routes
application.use((error, request, response, next) => {
    console.error('Server error:', error);
    response.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// --- Start the server ---
application.listen(port, () => {
    console.log(`AI Dataset Annotation Tool Server running at http://localhost:${port}`);
    console.log(`SQLite Database endpoint: http://localhost:${port}/SQLite/Images`);
    console.log(`Images API: http://localhost:${port}/API/images`);
    console.log(`Labels API: http://localhost:${port}/API/labels`);
    console.log(`Frontend: http://localhost:${port}`);
});

export default application;