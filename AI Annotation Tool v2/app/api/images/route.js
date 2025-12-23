/**
 * API route for managing images
 * Uses data access layer for database operations
 */

import { NextResponse } from 'next/server';
import { getAllImages, createImage } from '../../../lib/data-access/images.js';

// GET /api/images - Get all images with their annotations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get all images using data access layer
    const allImages = await getAllImages();

    // Calculate pagination
    const totalImages = allImages.length;
    const totalPages = Math.ceil(totalImages / limit);
    const offset = (page - 1) * limit;
    const paginatedImages = allImages.slice(offset, offset + limit);

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
  }
}

// POST /api/images - Add a new image (with optional Firebase upload)
export async function POST(request) {
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

      // Get auth token from header
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication token required for file upload' },
          { status: 401 }
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

      // Upload to Firebase Storage via Vercel API
      const { uploadToFirebase } = await import('../../../lib/utils/firebase-storage.js');

      try {
        const uploadResult = await uploadToFirebase(file, file.name, 'annotations', token);

        // Create database record
        const newImage = await createImage({
          filename: uploadResult.fileName,
          original_name: file.name,
          file_path: uploadResult.imageUrl,
          file_size: uploadResult.fileSize,
          mime_type: uploadResult.mimeType
        });

        return NextResponse.json({
          success: true,
          data: newImage,
          firebaseUrl: uploadResult.imageUrl
        }, { status: 201 });

      } catch (uploadError) {
        console.error('Firebase upload error:', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload to Firebase Storage', details: uploadError.message },
          { status: 500 }
        );
      }
    }

    // Handle JSON for direct database creation (existing functionality)
    const { filename, original_name, file_path, file_size, mime_type } = await request.json();

    // Validate required fields
    if (!filename || !original_name || !file_path || !file_size || !mime_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create image using data access layer
    const newImage = await createImage({
      filename,
      original_name,
      file_path,
      file_size,
      mime_type
    });

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
  }
}