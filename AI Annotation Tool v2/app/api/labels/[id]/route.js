/**
 * API route for managing individual labels by ID
 * Handles GET, PUT, and DELETE operations
 */

import { NextResponse } from 'next/server';
import { updateLabel, deleteLabel } from '../../../../lib/data-access/labels.js';
import proxy from '../../../../lib/database/proxy.js';

// GET /api/labels/[id] - Get a specific label by ID
export async function GET(request, { params }) {
  try {
    const labelId = parseInt(params.id);

    if (isNaN(labelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid label ID' },
        { status: 400 }
      );
    }

    const label = proxy.labels.findById(labelId);

    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch label', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/labels/[id] - Update label
export async function PUT(request, { params }) {
  try {
    const labelId = parseInt(params.id);

    if (isNaN(labelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid label ID' },
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
    const allowedFields = ['label_name', 'label_description'];
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

    const updatedLabel = await updateLabel(labelId, updateData);

    if (!updatedLabel) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedLabel
    });
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update label', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/labels/[id] - Delete label (cascades to annotations)
export async function DELETE(request, { params }) {
  try {
    const labelId = parseInt(params.id);

    if (isNaN(labelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid label ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteLabel(labelId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Label deleted successfully',
      deletedId: labelId
    });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete label', details: error.message },
      { status: 500 }
    );
  }
}
