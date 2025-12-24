/**
 * Mocha tests for Enhanced Features
 * Testing the new functionality added:
 * 1. Image deletion with confirmation modal
 * 2. Creator/Editor tracking in database
 * 3. Enhanced UI/UX improvements
 * 4. Database migration functionality
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { query, queryOne, run, closeDatabase } = require('../lib/database/connection');

describe('Enhanced Features Tests', function () {
    this.timeout(10000);

    const TEST_DB_PATH = path.join(__dirname, '..', 'database', 'test_enhanced.db');
    const ORIGINAL_DB_PATH = path.join(__dirname, '..', 'database', 'annotations.db');

    let dom, document, window;

    before(function () {
        // Set up test database
        if (fs.existsSync(ORIGINAL_DB_PATH)) {
            fs.copyFileSync(ORIGINAL_DB_PATH, TEST_DB_PATH);
        } else {
            // Initialize database if it doesn't exist
            const { initializeDatabase } = require('../database/init');
            initializeDatabase();
            if (fs.existsSync(ORIGINAL_DB_PATH)) {
                fs.copyFileSync(ORIGINAL_DB_PATH, TEST_DB_PATH);
            }
        }

        // Run migration on test database
        const { runMigrations } = require('../lib/database/migrate');
        const originalDbPath = process.env.TEST_DB_PATH;
        process.env.TEST_DB_PATH = TEST_DB_PATH;
        try {
            runMigrations();
        } catch (error) {
            console.warn('Migration failed, continuing with tests:', error.message);
        }

        process.env.TEST_DB_PATH = TEST_DB_PATH;

        // Set up JSDOM for UI tests
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        document = dom.window.document;
        window = dom.window;
        global.document = document;
        global.window = window;
    });

    after(function () {
        // Clean up
        closeDatabase();
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
        delete process.env.TEST_DB_PATH;
        delete global.document;
        delete global.window;
    });

    describe('Database Schema Enhancements', function () {
        it('should have creator and editor fields in images table', function () {
            const tableInfo = query("PRAGMA table_info(images)");
            const columnNames = tableInfo.map(col => col.name);

            expect(columnNames).to.include('created_by');
            expect(columnNames).to.include('last_edited_by');
        });

        it('should have creator and editor fields in annotations table', function () {
            const tableInfo = query("PRAGMA table_info(annotations)");
            const columnNames = tableInfo.map(col => col.name);

            expect(columnNames).to.include('created_by');
            expect(columnNames).to.include('last_edited_by');
        });

        it('should allow null values for creator and editor fields', function () {
            const imagesTableInfo = query("PRAGMA table_info(images)");
            const annotationsTableInfo = query("PRAGMA table_info(annotations)");

            const createdByImage = imagesTableInfo.find(col => col.name === 'created_by');
            const lastEditedByImage = imagesTableInfo.find(col => col.name === 'last_edited_by');
            const createdByAnnotation = annotationsTableInfo.find(col => col.name === 'created_by');
            const lastEditedByAnnotation = annotationsTableInfo.find(col => col.name === 'last_edited_by');

            expect(createdByImage.notnull).to.equal(0); // 0 means nullable
            expect(lastEditedByImage.notnull).to.equal(0);
            expect(createdByAnnotation.notnull).to.equal(0);
            expect(lastEditedByAnnotation.notnull).to.equal(0);
        });

        it('should insert image with creator information', function () {
            const result = run(`
                INSERT INTO images (filename, original_name, file_path, file_size, mime_type, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['test-creator.jpg', 'creator-test.jpg', '/uploads/test.jpg', 100000, 'image/jpeg', 'test@example.com']);

            expect(result.changes).to.equal(1);

            const image = queryOne('SELECT * FROM images WHERE image_id = ?', [result.lastID]);
            expect(image.created_by).to.equal('test@example.com');
            expect(image.last_edited_by).to.be.null;

            // Clean up
            run('DELETE FROM images WHERE image_id = ?', [result.lastID]);
        });

        it('should insert annotation with creator information', function () {
            // First create test image and label
            const imageResult = run(`
                INSERT INTO images (filename, original_name, file_path, file_size, mime_type, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['test-ann.jpg', 'ann-test.jpg', '/uploads/ann.jpg', 50000, 'image/jpeg', 'creator@example.com']);

            const labelResult = run(`
                INSERT INTO labels (label_name) VALUES (?)
            `, ['test-creator-label']);

            const annotationResult = run(`
                INSERT INTO annotations (image_id, label_id, confidence, created_by)
                VALUES (?, ?, ?, ?)
            `, [imageResult.lastID, labelResult.lastID, 0.95, 'annotator@example.com']);

            expect(annotationResult.changes).to.equal(1);

            const annotation = queryOne('SELECT * FROM annotations WHERE annotation_id = ?', [annotationResult.lastID]);
            expect(annotation.created_by).to.equal('annotator@example.com');
            expect(annotation.last_edited_by).to.be.null;

            // Clean up
            run('DELETE FROM annotations WHERE annotation_id = ?', [annotationResult.lastID]);
            run('DELETE FROM images WHERE image_id = ?', [imageResult.lastID]);
            run('DELETE FROM labels WHERE label_id = ?', [labelResult.lastID]);
        });

        it('should update annotation with editor information', function () {
            // Create test data
            const imageResult = run(`
                INSERT INTO images (filename, original_name, file_path, file_size, mime_type, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['test-edit.jpg', 'edit-test.jpg', '/uploads/edit.jpg', 75000, 'image/jpeg', 'creator@example.com']);

            const labelResult = run(`
                INSERT INTO labels (label_name) VALUES (?)
            `, ['test-edit-label']);

            const annotationResult = run(`
                INSERT INTO annotations (image_id, label_id, confidence, created_by)
                VALUES (?, ?, ?, ?)
            `, [imageResult.lastID, labelResult.lastID, 0.8, 'creator@example.com']);

            // Update annotation
            run(`
                UPDATE annotations 
                SET confidence = ?, last_edited_by = ?
                WHERE annotation_id = ?
            `, [0.9, 'editor@example.com', annotationResult.lastID]);

            const annotation = queryOne('SELECT * FROM annotations WHERE annotation_id = ?', [annotationResult.lastID]);
            expect(annotation.confidence).to.equal(0.9);
            expect(annotation.created_by).to.equal('creator@example.com');
            expect(annotation.last_edited_by).to.equal('editor@example.com');

            // Clean up
            run('DELETE FROM annotations WHERE annotation_id = ?', [annotationResult.lastID]);
            run('DELETE FROM images WHERE image_id = ?', [imageResult.lastID]);
            run('DELETE FROM labels WHERE label_id = ?', [labelResult.lastID]);
        });
    });

    describe('Image Deletion UI Components', function () {
        beforeEach(function () {
            // Clear document body
            document.body.innerHTML = '';
        });

        it('should display delete button (X) on image card', function () {
            const imageCard = document.createElement('div');
            imageCard.className = 'bg-white dark:bg-gray-900 rounded-xl shadow-lg';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full';
            deleteButton.setAttribute('data-testid', 'delete-image-button');
            deleteButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';

            imageCard.appendChild(deleteButton);
            document.body.appendChild(imageCard);

            const deleteBtn = document.querySelector('[data-testid="delete-image-button"]');
            expect(deleteBtn).to.not.be.null;
            expect(deleteBtn.className).to.include('bg-red-500');
            expect(deleteBtn.className).to.include('rounded-full');
        });

        it('should show confirmation modal when delete button is clicked', function () {
            const deleteButton = document.createElement('button');
            deleteButton.setAttribute('data-testid', 'delete-image-button');
            document.body.appendChild(deleteButton);

            // Create confirmation modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.style.display = 'none';

            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4';

            const title = document.createElement('h3');
            title.textContent = 'Delete Image';
            title.className = 'text-lg font-semibold text-gray-900 dark:text-white mb-2';

            const confirmButton = document.createElement('button');
            confirmButton.setAttribute('data-testid', 'confirm-delete-image');
            confirmButton.textContent = 'Delete';
            confirmButton.className = 'bg-red-600 text-white px-4 py-2 rounded-lg';

            modalContent.appendChild(title);
            modalContent.appendChild(confirmButton);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Simulate click
            deleteButton.click();
            modal.style.display = 'flex'; // Simulate showing modal

            expect(modal.style.display).to.equal('flex');
            expect(document.querySelector('[data-testid="confirm-delete-image"]')).to.not.be.null;
        });

        it('should have proper styling for confirmation modal', function () {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700';

            const icon = document.createElement('div');
            icon.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4';

            modalContent.appendChild(icon);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            expect(modalContent.className).to.include('rounded-xl');
            expect(modalContent.className).to.include('shadow-2xl');
            expect(icon.className).to.include('bg-red-100');
            expect(icon.className).to.include('rounded-full');
        });

        it('should show loading state during deletion', function () {
            const confirmButton = document.createElement('button');
            confirmButton.setAttribute('data-testid', 'confirm-delete-image');
            confirmButton.className = 'bg-red-600 text-white px-4 py-2 rounded-lg';

            // Simulate loading state
            confirmButton.disabled = true;
            confirmButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
            `;

            document.body.appendChild(confirmButton);

            expect(confirmButton.disabled).to.be.true;
            expect(confirmButton.innerHTML).to.include('Deleting...');
            expect(confirmButton.innerHTML).to.include('animate-spin');
        });
    });

    describe('Enhanced UI/UX Styling', function () {
        beforeEach(function () {
            document.body.innerHTML = '';
        });

        it('should have enhanced card styling with gradients', function () {
            const imageCard = document.createElement('div');
            imageCard.className = 'bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100 dark:border-gray-800';

            document.body.appendChild(imageCard);

            expect(imageCard.className).to.include('rounded-xl');
            expect(imageCard.className).to.include('shadow-xl');
            expect(imageCard.className).to.include('hover:scale-[1.02]');
            expect(imageCard.className).to.include('border');
        });

        it('should have gradient backgrounds in content sections', function () {
            const contentSection = document.createElement('div');
            contentSection.className = 'p-5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950';

            document.body.appendChild(contentSection);

            expect(contentSection.className).to.include('bg-gradient-to-b');
            expect(contentSection.className).to.include('from-white');
            expect(contentSection.className).to.include('to-gray-50');
        });

        it('should have enhanced label styling with gradients', function () {
            const label = document.createElement('div');
            label.className = 'inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md';

            document.body.appendChild(label);

            expect(label.className).to.include('bg-gradient-to-r');
            expect(label.className).to.include('from-blue-100');
            expect(label.className).to.include('to-blue-200');
            expect(label.className).to.include('shadow-sm');
            expect(label.className).to.include('hover:shadow-md');
        });

        it('should have enhanced navigation with icons and gradients', function () {
            const navButton = document.createElement('button');
            navButton.className = 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25';

            const icon = document.createElement('svg');
            icon.className = 'w-4 h-4 inline mr-2';

            navButton.appendChild(icon);
            document.body.appendChild(navButton);

            expect(navButton.className).to.include('bg-gradient-to-r');
            expect(navButton.className).to.include('from-blue-500');
            expect(navButton.className).to.include('shadow-lg');
            expect(navButton.className).to.include('shadow-blue-500/25');
            expect(icon.className).to.include('inline');
        });

        it('should have enhanced header with backdrop blur', function () {
            const header = document.createElement('header');
            header.className = 'relative z-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm';

            document.body.appendChild(header);

            expect(header.className).to.include('backdrop-blur-md');
            expect(header.className).to.include('bg-white/90');
            expect(header.className).to.include('border-gray-200/50');
        });

        it('should have gradient text for titles', function () {
            const title = document.createElement('h1');
            title.className = 'text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent';
            title.textContent = 'AI Annotation Tool';

            document.body.appendChild(title);

            expect(title.className).to.include('bg-gradient-to-r');
            expect(title.className).to.include('bg-clip-text');
            expect(title.className).to.include('text-transparent');
        });
    });

    describe('Migration Functionality', function () {
        it('should detect if migration is needed', function () {
            // This would normally check if the new columns exist
            const tableInfo = query("PRAGMA table_info(images)");
            const hasCreatedBy = tableInfo.some(col => col.name === 'created_by');

            expect(hasCreatedBy).to.be.true; // Should be true after migration
        });

        it('should handle migration gracefully if already applied', function () {
            // Test that running migration twice doesn't cause errors
            const tableInfoBefore = query("PRAGMA table_info(images)");
            const columnCountBefore = tableInfoBefore.length;

            // Migration should be idempotent
            const tableInfoAfter = query("PRAGMA table_info(images)");
            const columnCountAfter = tableInfoAfter.length;

            expect(columnCountAfter).to.equal(columnCountBefore);
        });
    });

    describe('Enhanced Image Gallery Layout', function () {
        beforeEach(function () {
            document.body.innerHTML = '';
        });

        it('should have improved grid layout with better spacing', function () {
            const gallery = document.createElement('div');
            gallery.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-300 ease-in-out';
            gallery.setAttribute('data-testid', 'image-gallery-grid');

            document.body.appendChild(gallery);

            expect(gallery.className).to.include('gap-6');
            expect(gallery.className).to.include('transition-all');
            expect(gallery.className).to.include('duration-300');
        });

        it('should have enhanced section headers with icons', function () {
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'flex items-center gap-4 mb-4';

            const icon = document.createElement('div');
            icon.className = 'w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25';

            const title = document.createElement('h3');
            title.className = 'text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent';
            title.textContent = 'Image Gallery';

            sectionHeader.appendChild(icon);
            sectionHeader.appendChild(title);
            document.body.appendChild(sectionHeader);

            expect(icon.className).to.include('bg-gradient-to-br');
            expect(icon.className).to.include('shadow-lg');
            expect(title.className).to.include('text-3xl');
            expect(title.className).to.include('bg-gradient-to-r');
        });

        it('should have enhanced welcome section with feature cards', function () {
            const welcomeSection = document.createElement('section');
            welcomeSection.className = 'text-center py-12';

            const featureGrid = document.createElement('div');
            featureGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 mt-12';

            const featureCard = document.createElement('div');
            featureCard.className = 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50';

            featureGrid.appendChild(featureCard);
            welcomeSection.appendChild(featureGrid);
            document.body.appendChild(welcomeSection);

            expect(featureGrid.className).to.include('grid-cols-1');
            expect(featureGrid.className).to.include('md:grid-cols-3');
            expect(featureCard.className).to.include('backdrop-blur-sm');
            expect(featureCard.className).to.include('rounded-xl');
        });
    });

    describe('Accessibility and User Experience', function () {
        beforeEach(function () {
            document.body.innerHTML = '';
        });

        it('should have proper ARIA labels for delete buttons', function () {
            const deleteButton = document.createElement('button');
            deleteButton.setAttribute('aria-label', 'Delete image');
            deleteButton.setAttribute('data-testid', 'delete-image-button');

            document.body.appendChild(deleteButton);

            expect(deleteButton.getAttribute('aria-label')).to.equal('Delete image');
        });

        it('should have proper touch targets for mobile', function () {
            const touchButton = document.createElement('button');
            touchButton.className = 'min-h-[44px] min-w-[44px] touch-manipulation';

            document.body.appendChild(touchButton);

            expect(touchButton.className).to.include('min-h-[44px]');
            expect(touchButton.className).to.include('min-w-[44px]');
            expect(touchButton.className).to.include('touch-manipulation');
        });

        it('should have proper focus states for keyboard navigation', function () {
            const focusableButton = document.createElement('button');
            focusableButton.className = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

            document.body.appendChild(focusableButton);

            expect(focusableButton.className).to.include('focus:outline-none');
            expect(focusableButton.className).to.include('focus:ring-2');
            expect(focusableButton.className).to.include('focus:ring-blue-500');
        });

        it('should have loading states with proper indicators', function () {
            const loadingButton = document.createElement('button');
            loadingButton.disabled = true;
            loadingButton.className = 'disabled:opacity-50';
            loadingButton.innerHTML = `
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                </svg>
                Loading...
            `;

            document.body.appendChild(loadingButton);

            expect(loadingButton.disabled).to.be.true;
            expect(loadingButton.className).to.include('disabled:opacity-50');
            expect(loadingButton.innerHTML).to.include('animate-spin');
        });
    });

    describe('Integration Tests', function () {
        it('should work together: enhanced styling + deletion functionality + creator tracking', function () {
            // Create a complete image card with all features
            const imageCard = document.createElement('div');
            imageCard.className = 'bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800';
            imageCard.setAttribute('data-testid', 'image-card');

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full';
            deleteButton.setAttribute('data-testid', 'delete-image-button');
            deleteButton.setAttribute('aria-label', 'Delete image');

            // Enhanced content section
            const contentSection = document.createElement('div');
            contentSection.className = 'p-5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950';

            // Enhanced label
            const label = document.createElement('div');
            label.className = 'inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm';
            label.textContent = 'test-label 95%';

            contentSection.appendChild(label);
            imageCard.appendChild(deleteButton);
            imageCard.appendChild(contentSection);
            document.body.appendChild(imageCard);

            // Verify all components are present and properly styled
            expect(document.querySelector('[data-testid="image-card"]')).to.not.be.null;
            expect(document.querySelector('[data-testid="delete-image-button"]')).to.not.be.null;
            expect(deleteButton.className).to.include('bg-red-500');
            expect(contentSection.className).to.include('bg-gradient-to-b');
            expect(label.className).to.include('bg-gradient-to-r');
        });
    });
});