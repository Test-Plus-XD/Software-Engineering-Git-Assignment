/**
 * API route for importing CSV data
 * Handles CSV import of images and annotations data
 */

import { NextResponse } from 'next/server';
import { query, run } from '../../../../lib/database/connection';
const proxy = require('../../../../lib/database/proxy');

// POST /api/import/csv - Import CSV data
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Read file content
        const csvContent = await file.text();
        const lines = csvContent.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            return NextResponse.json(
                { success: false, error: 'CSV file must contain headers and at least one data row' },
                { status: 400 }
            );
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Validate required headers
        const requiredHeaders = ['image_id', 'filename', 'labels'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            return NextResponse.json(
                { success: false, error: `Missing required headers: ${missingHeaders.join(', ')}` },
                { status: 400 }
            );
        }

        let imported = 0;
        let skipped = 0;
        let errors = 0;
        const errorDetails = [];

        // Get user info from request headers (if available)
        const userEmail = request.headers.get('x-user-email') || 'csv-import';

        // Process each data row
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = parseCSVLine(lines[i]);

                if (values.length !== headers.length) {
                    errors++;
                    errorDetails.push(`Row ${i + 1}: Column count mismatch`);
                    continue;
                }

                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index];
                });

                // Validate required fields
                if (!rowData.image_id || !rowData.filename) {
                    errors++;
                    errorDetails.push(`Row ${i + 1}: Missing required fields (image_id, filename)`);
                    continue;
                }

                await proxy.transaction(() => {
                    // Check if image already exists
                    const existingImage = query(`
                        SELECT image_id FROM images WHERE image_id = ?
                    `, [parseInt(rowData.image_id)]);

                    if (existingImage.length > 0) {
                        skipped++;
                        return;
                    }

                    // Insert image record
                    run(`
                        INSERT INTO images (
                            image_id, filename, original_name, file_path, 
                            file_size, mime_type, uploaded_at, 
                            created_by, last_edited_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        parseInt(rowData.image_id),
                        rowData.filename || '',
                        rowData.original_name || rowData.filename || '',
                        rowData.file_path || '',
                        parseInt(rowData.file_size) || 0,
                        rowData.mime_type || 'image/jpeg',
                        rowData.uploaded_at || new Date().toISOString(),
                        rowData.image_created_by || userEmail,
                        rowData.image_last_edited_by || null
                    ]);

                    // Process labels if they exist
                    if (rowData.labels && rowData.labels.trim()) {
                        const labels = rowData.labels.split(',').map(l => l.trim());
                        const confidences = rowData.confidences ?
                            rowData.confidences.split(',').map(c => parseFloat(c.trim()) || 1.0) :
                            labels.map(() => 1.0);
                        const annotationCreators = rowData.annotation_creators ?
                            rowData.annotation_creators.split(',').map(c => c.trim()) :
                            labels.map(() => userEmail);
                        const annotationEditors = rowData.annotation_editors ?
                            rowData.annotation_editors.split(',').map(e => e.trim()) :
                            labels.map(() => null);

                        labels.forEach((labelName, index) => {
                            if (!labelName) return;

                            // Get or create label
                            let labelResult = query(`
                                SELECT label_id FROM labels WHERE label_name = ?
                            `, [labelName]);

                            let labelId;
                            if (labelResult.length === 0) {
                                run(`
                                    INSERT INTO labels (label_name) VALUES (?)
                                `, [labelName]);

                                labelResult = query(`
                                    SELECT label_id FROM labels WHERE label_name = ?
                                `, [labelName]);
                            }
                            labelId = labelResult[0].label_id;

                            // Create annotation
                            run(`
                                INSERT INTO annotations (
                                    image_id, label_id, confidence, 
                                    created_by, last_edited_by
                                ) VALUES (?, ?, ?, ?, ?)
                            `, [
                                parseInt(rowData.image_id),
                                labelId,
                                confidences[index] || 1.0,
                                annotationCreators[index] || userEmail,
                                annotationEditors[index] || null
                            ]);
                        });
                    }

                    imported++;
                });

            } catch (rowError) {
                errors++;
                errorDetails.push(`Row ${i + 1}: ${rowError.message}`);
                console.error(`Error processing row ${i + 1}:`, rowError);
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            errors,
            errorDetails: errorDetails.slice(0, 10), // Limit error details to first 10
            message: `Import completed: ${imported} imported, ${skipped} skipped, ${errors} errors`
        });

    } catch (error) {
        console.error('Error importing CSV:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to import CSV', details: error.message },
            { status: 500 }
        );
    }
}

// Helper function to parse CSV line with proper quote handling
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }

    // Add the last field
    values.push(current.trim());

    return values;
}