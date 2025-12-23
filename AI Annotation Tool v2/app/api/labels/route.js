/**
 * API route for managing labels
 * Example usage of the database connection utility
 */

import { query, run } from '../../../lib/database/connection';
import { NextResponse } from 'next/server';

// GET /api/labels - Get all labels
export async function GET() {
  try {
    const labels = await query(`
      SELECT 
        l.*,
        COUNT(a.annotation_id) as usage_count
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      GROUP BY l.label_id
      ORDER BY l.label_name
    `);

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

// POST /api/labels - Create a new label
export async function POST(request) {
  try {
    const { label_name, label_description } = await request.json();

    const result = await run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      [label_name, label_description]
    );

    const newLabel = await query(
      'SELECT * FROM labels WHERE label_id = ?',
      [result.lastID]
    );

    return NextResponse.json(newLabel[0], { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}