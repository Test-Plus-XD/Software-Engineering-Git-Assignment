/**
 * API route for getting common labels
 * Returns all existing labels from the database
 */

import { NextResponse } from 'next/server';
import { getAllLabels } from '../../../../lib/data-access/labels.js';

// GET /api/labels/common - Get all labels as common labels
export async function GET() {
  try {
    const labels = await getAllLabels();

    // Extract just the label names for the dropdown
    const labelNames = labels.map(label => label.label_name);

    return NextResponse.json({
      success: true,
      labels: labelNames
    });
  } catch (error) {
    console.error('Error fetching common labels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch common labels', details: error.message },
      { status: 500 }
    );
  }
}
