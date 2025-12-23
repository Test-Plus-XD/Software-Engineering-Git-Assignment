-- AI Dataset Annotation Tool v2 - Database Schema
-- This schema implements a many-to-many relationship between images and labels through an annotations junction table
-- Compatible with Assignment 1 requirements

-- Images table stores metadata about uploaded image files
-- Each image has a unique identifier and information about the file
CREATE TABLE IF NOT EXISTS images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Labels table stores all available labels that can be applied to images
-- Labels are reusable across multiple images for consistency
CREATE TABLE IF NOT EXISTS labels (
    label_id INTEGER PRIMARY KEY AUTOINCREMENT,
    label_name TEXT NOT NULL UNIQUE,
    label_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Annotations table creates the many-to-many relationship between images and labels
-- This junction table allows one image to have multiple labels and one label to be applied to multiple images
-- The UNIQUE constraint prevents duplicate annotations (same label applied twice to the same image)
CREATE TABLE IF NOT EXISTS annotations (
    annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    confidence REAL DEFAULT 1.0 CHECK(confidence >= 0.0 AND confidence <= 1.0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE,
    UNIQUE(image_id, label_id)
);

-- Index for faster queries when searching by label
-- This improves performance when finding all images with a specific label
CREATE INDEX IF NOT EXISTS idx_annotations_label ON annotations(label_id);

-- Index for faster queries when retrieving all labels for a specific image
-- This improves performance when loading image details with all associated labels
CREATE INDEX IF NOT EXISTS idx_annotations_image ON annotations(image_id);

-- Index for faster queries when searching images by filename
-- Useful for checking if an image already exists before upload
CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);

-- Index for faster queries when searching labels by name
-- Improves performance when checking if a label exists before creation
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(label_name);