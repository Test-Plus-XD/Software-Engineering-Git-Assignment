/**
 * API route for managing labels
 * Uses data access layer for database operations
 */

import { NextResponse } from 'next/server';
import { getAllLabels, createLabel } from '../../../lib/data-access/labels.js';

// GET /api/labels - Get all labels with usage statistics
export async function GET() {
  try {
    const labels = await getAllLabels();

    return NextResponse.json({
      success: true,
      data: labels
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labels', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/labels - Create a new label (with duplicate handling)
export async function POST(request) {
  try {
    const { label_name, label_description } = await request.json();

    // Validate label_name
    if (!label_name || typeof label_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'label_name is required and must be a string' },
        { status: 400 }
      );
    }

    // Create label using data access layer (handles duplicates gracefully)
    const newLabel = await createLabel({
      label_name,
      label_description: label_description || null
    });

    return NextResponse.json({
      success: true,
      data: newLabel
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create label', details: error.message },
      { status: 500 }
    );
  }
}