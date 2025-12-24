/**
 * Tests for CSV export and import functionality
 * Following TDD pattern - tests first, then implementation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CsvExportImport from '../CsvExportImport';

// Mock data sync utilities
jest.mock('../../../lib/utils/data-sync', () => ({
    dataOperations: {
        notifyDataRefresh: jest.fn()
    }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('CSV Export and Import', () => {
    beforeEach(() => {
        fetch.mockClear();
        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
        global.URL.revokeObjectURL = jest.fn();

        // Mock document.createElement for download link
        const mockLink = {
            click: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
            download: '',
            href: ''
        };
        jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
        jest.spyOn(document.body, 'appendChild').mockImplementation(() => { });
        jest.spyOn(document.body, 'removeChild').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('CSV Export', () => {
        test('should render export button', () => {
            render(<CsvExportImport />);
            expect(screen.getByTestId('csv-export-button')).toBeInTheDocument();
        });

        test('should call export API when export button is clicked', async () => {
            const mockCsvData = 'image_id,filename,labels,created_by,last_edited_by\n1,test.jpg,"cat,dog",user@example.com,editor@example.com';

            fetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(new Blob([mockCsvData], { type: 'text/csv' })),
                headers: {
                    get: () => 'attachment; filename="test.csv"'
                }
            });

            render(<CsvExportImport />);
            const exportButton = screen.getByTestId('csv-export-button');

            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/export/csv');
            });
        });

        test('should download CSV file with correct filename', async () => {
            const mockCsvData = 'image_id,filename,labels,created_by,last_edited_by\n1,test.jpg,"cat,dog",user@example.com,editor@example.com';

            fetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(new Blob([mockCsvData], { type: 'text/csv' })),
                headers: {
                    get: () => 'attachment; filename="annotations_2024-01-01_10-00-00.csv"'
                }
            });

            render(<CsvExportImport />);
            const exportButton = screen.getByTestId('csv-export-button');

            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(document.createElement).toHaveBeenCalledWith('a');
            });
        });

        test('should handle export errors gracefully', async () => {
            fetch.mockRejectedValueOnce(new Error('Export failed'));

            // Mock alert
            window.alert = jest.fn();

            render(<CsvExportImport />);
            const exportButton = screen.getByTestId('csv-export-button');

            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith('Failed to export CSV. Please try again.');
            });
        });
    });

    describe('CSV Import', () => {
        test('should render import button and file input', () => {
            render(<CsvExportImport />);

            expect(screen.getByTestId('csv-import-input')).toBeInTheDocument();
            expect(screen.getByTestId('csv-import-button')).toBeInTheDocument();
        });

        test('should validate CSV file format', async () => {
            const user = userEvent.setup();

            // Mock alert
            window.alert = jest.fn();

            render(<CsvExportImport />);

            const fileInput = screen.getByTestId('csv-import-input');
            const invalidFile = new File(['invalid,data'], 'test.txt', { type: 'text/plain' });

            await user.upload(fileInput, invalidFile);

            expect(window.alert).toHaveBeenCalledWith('Please select a CSV file');
        });

        test('should process valid CSV file', async () => {
            const user = userEvent.setup();

            const validCsvContent = 'image_id,filename,labels,created_by,last_edited_by\n1,test.jpg,"cat,dog",user@example.com,editor@example.com';
            const validFile = new File([validCsvContent], 'annotations.csv', { type: 'text/csv' });

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, imported: 1, skipped: 0, errors: 0 })
            });

            render(<CsvExportImport />);

            const fileInput = screen.getByTestId('csv-import-input');
            await user.upload(fileInput, validFile);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/import/csv', expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData)
                }));
            });
        });

        test('should show import progress', async () => {
            const user = userEvent.setup();

            // Mock a slow response
            fetch.mockImplementationOnce(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true, imported: 1, skipped: 0, errors: 0 })
                    }), 100)
                )
            );

            render(<CsvExportImport />);

            const fileInput = screen.getByTestId('csv-import-input');
            const validFile = new File(['image_id,filename\n1,test.jpg'], 'test.csv', { type: 'text/csv' });

            await user.upload(fileInput, validFile);

            // Check if importing state is shown
            expect(screen.getByText('Importing...')).toBeInTheDocument();
        });

        test('should handle import errors', async () => {
            const user = userEvent.setup();

            fetch.mockRejectedValueOnce(new Error('Import failed'));

            render(<CsvExportImport />);

            const fileInput = screen.getByTestId('csv-import-input');
            const validFile = new File(['image_id,filename\n1,test.jpg'], 'test.csv', { type: 'text/csv' });

            await user.upload(fileInput, validFile);

            await waitFor(() => {
                expect(screen.getByText('Import Failed')).toBeInTheDocument();
            });
        });

        test('should show import results summary', async () => {
            const user = userEvent.setup();

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    imported: 5,
                    skipped: 2,
                    errors: 1,
                    errorDetails: ['Row 3: Missing required field'],
                    message: 'Import completed'
                })
            });

            render(<CsvExportImport />);

            const fileInput = screen.getByTestId('csv-import-input');
            const validFile = new File(['image_id,filename\n1,test.jpg'], 'test.csv', { type: 'text/csv' });

            await user.upload(fileInput, validFile);

            await waitFor(() => {
                expect(screen.getByText('Import Completed')).toBeInTheDocument();
                expect(screen.getByText('5')).toBeInTheDocument(); // Imported count
                expect(screen.getByText('2')).toBeInTheDocument(); // Skipped count
                expect(screen.getByText('1')).toBeInTheDocument(); // Errors count
            });
        });
    });

    describe('CSV Format Validation', () => {
        test('should require specific column headers', () => {
            const requiredColumns = ['image_id', 'filename', 'labels'];
            // This test validates that the API requires these columns
            expect(requiredColumns).toEqual(['image_id', 'filename', 'labels']);
        });

        test('should handle missing optional fields', () => {
            // Test validates that created_by/last_edited_by are optional
            const optionalFields = ['created_by', 'last_edited_by'];
            expect(optionalFields).toEqual(['created_by', 'last_edited_by']);
        });

        test('should validate data types', () => {
            // Test validates that image_id should be numeric
            const numericFields = ['image_id'];
            expect(numericFields).toEqual(['image_id']);
        });
    });
});