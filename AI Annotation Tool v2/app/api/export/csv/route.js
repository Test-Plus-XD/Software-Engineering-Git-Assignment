/**
 * API route for exporting database as CSV
 * Handles CSV export of images and annotations data
 */

import { NextResponse } from 'next/server';
import { query } from '../../../../lib/database/connection';

// GET /api/export/csv - Export database as CSV
export async function GET(request) {
    try {
        // Query to get all images with their annotations and labels
        const data = query(`
            SELECT 
                i.image_id,
                i.filename,
                i.original_name,
                i.file_path,
                i.file_size,
                i.mime_type,
                i.uploaded_at,
                i.created_by as image_created_by,
                i.last_edited_by as image_last_edited_by,
                GROUP_CONCAT(l.label_name) as labels,
                GROUP_CONCAT(a.confidence) as confidences,
                GROUP_CONCAT(a.created_by) as annotation_creators,
                GROUP_CONCAT(a.last_edited_by) as annotation_editors
            FROM images i
            LEFT JOIN annotations a ON i.image_id = a.image_id
            LEFT JOIN labels l ON a.label_id = l.label_id
            GROUP BY i.image_id
            ORDER BY i.image_id
        `);

        // Convert to CSV format
        const csvHeaders = [
            'image_id',
            'filename',
            'original_name',
            'file_path',
            'file_size',
            'mime_type',
            'uploaded_at',
            'image_created_by',
            'image_last_edited_by',
            'labels',
            'confidences',
            'annotation_creators',
            'annotation_editors'
        ];

        let csvContent = csvHeaders.join(',') + '\n';

        data.forEach(row => {
            const csvRow = csvHeaders.map(header => {
                let value = row[header] || '';

                // Handle special formatting for certain fields
                if (header === 'labels' || header === 'confidences' ||
                    header === 'annotation_creators' || header === 'annotation_editors') {
                    // Wrap in quotes and escape internal quotes
                    value = `"${String(value).replace(/"/g, '""')}"`;
                } else {
                    // Escape commas and quotes in other fields
                    value = String(value).replace(/"/g, '""');
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                }

                return value;
            });

            csvContent += csvRow.join(',') + '\n';
        });

        // Create response with CSV content
        const response = new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="annotations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv"`
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting CSV:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to export CSV', details: error.message },
            { status: 500 }
        );
    }
}