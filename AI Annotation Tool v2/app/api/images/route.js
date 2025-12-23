/**
 * API route for managing images
 * Uses better-sqlite3 directly to avoid module system issues
 */

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database connection
function getDatabase() {
  const dbPath = path.join(process.cwd(), 'database', 'annotations.db');
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  return db;
}

// GET /api/images - Get all images with their annotations
export async function GET(request) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    db = getDatabase();

    // Get all images with their labels
    const allImages = db.prepare(`
      SELECT 
        i.*,
        GROUP_CONCAT(l.label_name) as labels,
        GROUP_CONCAT(a.confidence) as confidences
      FROM images i
      LEFT JOIN annotations a ON i.image_id = a.image_id
      LEFT JOIN labels l ON a.label_id = l.label_id
      GROUP BY i.image_id
      ORDER BY i.uploaded_at DESC
    `).all();

    // Process the results to format labels properly
    const processedImages = allImages.map(image => ({
      ...image,
      labels: image.labels ? image.labels.split(',') : [],
      confidences: image.confidences ? image.confidences.split(',').map(Number) : [],
      label_count: image.labels ? image.labels.split(',').length : 0
    }));

    // Calculate pagination
    const totalImages = processedImages.length;
    const totalPages = Math.ceil(totalImages / limit);
    const offset = (page - 1) * limit;
    const paginatedImages = processedImages.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedImages,
      pagination: {
        page,
        limit,
        totalImages,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images', details: error.message },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}

// POST /api/images - Add a new image
export async function POST(request) {
  let db;
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart/form-data for file uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image');

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No image file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type', allowedTypes },
          { status: 400 }
        );
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 10MB limit' },
          { status: 413 }
        );
      }

      db = getDatabase();

      // For now, create a database record without actual file storage
      // TODO: Implement actual file storage
      const stmt = db.prepare(`
        INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        file.name,
        file.name,
        `/uploads/${file.name}`, // Mock path for now
        file.size,
        file.type
      );

      const newImage = {
        image_id: result.lastInsertRowid,
        filename: file.name,
        original_name: file.name,
        file_path: `/uploads/${file.name}`,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        labels: [],
        confidences: [],
        label_count: 0
      };

      return NextResponse.json({
        success: true,
        data: newImage
      }, { status: 201 });
    }

    // Handle JSON for direct database creation
    const { filename, original_name, file_path, file_size, mime_type } = await request.json();

    // Validate required fields
    if (!filename || !original_name || !file_path || !file_size || !mime_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    db = getDatabase();

    // Create image record
    const stmt = db.prepare(`
      INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(filename, original_name, file_path, file_size, mime_type);

    const newImage = {
      image_id: result.lastInsertRowid,
      filename,
      original_name,
      file_path,
      file_size,
      mime_type,
      uploaded_at: new Date().toISOString(),
      labels: [],
      confidences: [],
      label_count: 0
    };

    return NextResponse.json({
      success: true,
      data: newImage
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create image', details: error.message },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}