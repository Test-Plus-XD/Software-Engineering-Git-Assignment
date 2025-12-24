-- Complete Database Seed File
-- Generated from current database state on 2025-12-24T07:28:31.999Z
-- This file contains all labels, images, and annotations for testing

-- ============================================================
-- LABELS
-- ============================================================
-- Insert all label definitions
INSERT OR IGNORE INTO labels (label_id, label_name, label_description, created_at) VALUES
    (1, 'cat', 'Domestic feline animals', '2025-11-19 09:31:04'),
    (2, 'dog', 'Domestic canine animals', '2025-11-19 09:31:04'),
    (3, 'animal', 'General animal category', '2025-11-19 09:31:04'),
    (4, 'person', 'Human beings', '2025-11-19 09:31:04'),
    (5, 'vehicle', 'Cars, trucks, motorcycles, etc.', '2025-11-19 09:31:04'),
    (6, 'building', 'Structures and architecture', '2025-11-19 09:31:04'),
    (7, 'nature', 'Natural landscapes and scenes', '2025-11-19 09:31:04'),
    (8, 'food', 'Edible items and meals', '2025-11-19 09:31:04'),
    (9, 'technology', 'Electronic devices and gadgets', '2025-11-19 09:31:04'),
    (10, 'indoor', 'Interior scenes', '2025-11-19 09:31:04'),
    (11, 'outdoor', 'Exterior scenes', '2025-11-19 09:31:04'),
    (12, 'portrait', 'Close-up of person or animal', '2025-11-19 09:31:04'),
    (13, 'landscape', 'Wide natural or urban scenes', '2025-11-19 09:31:04');

-- ============================================================
-- IMAGES
-- ============================================================
-- Insert all image records with Firebase Storage URLs
INSERT OR IGNORE INTO images (image_id, filename, original_name, file_path, file_size, mime_type, uploaded_at, updated_at) VALUES
    (1, 'sample-cat-001.jpg', 'my_cat.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-cat-001.jpg?alt=media&token=9789c13a-9fe9-492b-86cd-ce8018511f48', 245760, 'image/jpeg', '2025-11-19 09:32:35', '2025-11-19 09:32:35'),
    (2, 'sample-dog-001.jpg', 'golden_retriever.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-dog-001.jpg?alt=media&token=92137c9b-8346-48e3-ada8-0753f59cf93c', 312450, 'image/jpeg', '2025-11-19 09:32:35', '2025-11-19 09:32:35'),
    (3, 'sample-landscape-001.jpg', 'mountain_view.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-landscape-001.jpg?alt=media&token=db1e3a03-bdcf-42cc-970c-0f6820328dcd', 456789, 'image/jpeg', '2025-11-19 09:32:35', '2025-11-19 09:32:35'),
    (4, 'sample-person-001.jpg', 'portrait_photo.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-person-001.jpg?alt=media&token=b184f9aa-5c18-4f99-a909-f61e7dfd437d', 198765, 'image/jpeg', '2025-11-19 09:32:35', '2025-11-19 09:32:35'),
    (5, 'sample-food-001.jpg', 'lunch_plate.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-food-001.jpg?alt=media&token=00686225-78cb-4767-bae4-e8e17e710395', 287654, 'image/jpeg', '2025-11-19 09:32:35', '2025-11-19 09:32:35');

-- ============================================================
-- ANNOTATIONS
-- ============================================================
-- Insert all annotations (image-label relationships with confidence scores)
INSERT OR IGNORE INTO annotations (annotation_id, image_id, label_id, confidence, created_at) VALUES
    (1, 1, 1, 1, '2025-11-19 09:32:35'),
    (2, 1, 3, 0.95, '2025-11-19 09:32:35'),
    (3, 1, 10, 0.8, '2025-11-19 09:32:35'),
    (4, 2, 2, 1, '2025-11-19 09:32:35'),
    (5, 2, 3, 0.98, '2025-11-19 09:32:35'),
    (6, 2, 11, 0.9, '2025-11-19 09:32:35'),
    (7, 3, 7, 1, '2025-11-19 09:32:35'),
    (8, 3, 11, 1, '2025-11-19 09:32:35'),
    (9, 3, 13, 0.95, '2025-11-19 09:32:35'),
    (10, 4, 4, 1, '2025-11-19 09:32:35'),
    (11, 4, 12, 0.85, '2025-11-19 09:32:35'),
    (12, 4, 10, 0.7, '2025-11-19 09:32:35'),
    (13, 5, 8, 1, '2025-11-19 09:32:35'),
    (14, 5, 10, 0.9, '2025-11-19 09:32:35');

-- ============================================================
-- SUMMARY
-- ============================================================
-- Total records:
--   Labels: 13
--   Images: 5
--   Annotations: 14
--
-- This seed file provides a complete snapshot of the database
-- and can be used for testing and development environments.
