/**
 * API route for managing images
 * Example usage of the database connection utility
 */

import { query, queryOne, run } from '../../../lib/database/connection';
import { NextResponse } from 'next/server';

// GET /api/images - Get all images with their annotations
export async function GET() {
  try {
    const images = await query(`
      SELECT 
        i.*,
        GROUP_CONCAT(l.label_name) as labels,
        GROUP_CONCAT(a.confidence) as confidences
      FROM images i
      LEFT JOIN annotations a ON i.image_id = a.image_id
      LEFT JOIN labels l ON a.label_id = l.label_id
      GROUP BY i.image_id
      ORDER BY i.uploaded_at DESC
    `);

    // Parse the concatenated labels and confidences
    const imagesWithLabels = images.map(image => ({
      ...image,
      labels: image.labels ? image.labels.split(',') : [],
      confidences: image.confidences ? image.confidences.split(',').map(Number) : []
    }));

    return NextResponse.json(imagesWithLabels);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST /api/images - Add a new image
export async function POST(request) {
  try {
    const { filename, original_name, file_path, file_size, mime_type } = await request.json();

    const result = await run(
      'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
      [filename, original_name, file_path, file_size, mime_type]
    );

    const newImage = await queryOne(
      'SELECT * FROM images WHERE image_id = ?',
      [result.lastID]
    );

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}