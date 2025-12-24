/**
 * API route for managing annotations
 * Handles CRUD operations for image annotations
 */

import { NextResponse } from 'next/server';
import {
    updateAnnotationConfidence,
    deleteAnnotation,
    createAnnotation,
    getLabelIdByName
} from '../../../lib/data-access/annotations.js';
import { createLabel } from '../../../lib/data-access/labels.js';

// PATCH /api/annotations - Update annotation confidence
export async function PATCH(request) {
    try {
        const { imageId, labelName, confidence } = await request.json();

        // Validate required fields
        if (!imageId || !labelName || confidence === undefined) {
            return NextResponse.json(
                { success: false, error: 'imageId, labelName, and confidence are required' },
                { status: 400 }
            );
        }

        // Validate confidence range
        if (confidence < 0 || confidence > 100) {
            return NextResponse.json(
                { success: false, error: 'Confidence must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Convert percentage to decimal
        const confidenceDecimal = confidence / 100;

        // Get label ID
        const labelId = getLabelIdByName(labelName);
        if (!labelId) {
            return NextResponse.json(
                { success: false, error: 'Label not found' },
                { status: 404 }
            );
        }

        // Update annotation
        const annotation = updateAnnotationConfidence(imageId, labelId, confidenceDecimal);

        return NextResponse.json({
            success: true,
            data: annotation
        });
    } catch (error) {
        console.error('Error updating annotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update annotation', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/annotations - Delete annotation
export async function DELETE(request) {
    try {
        const { imageId, labelName } = await request.json();

        // Validate required fields
        if (!imageId || !labelName) {
            return NextResponse.json(
                { success: false, error: 'imageId and labelName are required' },
                { status: 400 }
            );
        }

        // Get label ID
        const labelId = getLabelIdByName(labelName);
        if (!labelId) {
            return NextResponse.json(
                { success: false, error: 'Label not found' },
                { status: 404 }
            );
        }

        // Delete annotation
        const deleted = deleteAnnotation(imageId, labelId);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Annotation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Annotation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting annotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete annotation', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/annotations - Create new annotation
export async function POST(request) {
    try {
        const { imageId, labelName, confidence = 100 } = await request.json();

        // Validate required fields
        if (!imageId || !labelName) {
            return NextResponse.json(
                { success: false, error: 'imageId and labelName are required' },
                { status: 400 }
            );
        }

        // Validate confidence range
        if (confidence < 0 || confidence > 100) {
            return NextResponse.json(
                { success: false, error: 'Confidence must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Convert percentage to decimal
        const confidenceDecimal = confidence / 100;

        // Get or create label
        let labelId = getLabelIdByName(labelName);
        if (!labelId) {
            // Create new label
            const newLabel = createLabel({ label_name: labelName });
            labelId = newLabel.label_id;
        }

        // Create annotation
        const annotation = createAnnotation(imageId, labelId, confidenceDecimal);

        return NextResponse.json({
            success: true,
            data: annotation
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating annotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create annotation', details: error.message },
            { status: 500 }
        );
    }
}
