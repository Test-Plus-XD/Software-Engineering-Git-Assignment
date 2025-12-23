/**
 * API route for managing individual images by ID
 * Handles GET, PUT, and DELETE operations
 */

import { NextResponse } from 'next/server';
import { getImageById, updateImage, deleteImage } from '../../../../lib/data-access/images.js';
import { deleteFromFirebase, extractFilenameFromUrl } from '../../../../lib/utils/firebase-storage.js';

// GET /api/images/[id] - Get a specific image by ID
export async function GET(request, { params }) {
  try {
    const imageId = parseInt(params.id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const image = await getImageById(imageId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/images/[id] - Update image metadata and labels
export async function PUT(request, { params }) {
  try {
    const imageId = parseInt(params.id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate that at least one field is being updated
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Only allow updating specific fields
    const allowedFields = ['original_name', 'file_path', 'file_size', 'mime_type'];
    const updateData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedImage = await updateImage(imageId, updateData);

    if (!updatedImage) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedImage
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update image', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/images/[id] - Delete image record and file from Firebase Storage
export async function DELETE(request, { params }) {
  try {
    const imageId = parseInt(params.id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    // Get image details before deletion to extract Firebase Storage path
    const image = await getImageById(imageId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Extract auth token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Delete from Firebase Storage if URL exists and token is provided
    if (image.file_path && token) {
      try {
        // Extract filename from URL if it's a Firebase URL
        const filename = extractFilenameFromUrl(image.file_path) || image.filename;
        await deleteFromFirebase(filename, token);
      } catch (storageError) {
        console.warn('Failed to delete from Firebase Storage:', storageError.message);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database (this cascades to annotations)
    const deleted = await deleteImage(imageId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      deletedId: imageId
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image', details: error.message },
      { status: 500 }
    );
  }
}
