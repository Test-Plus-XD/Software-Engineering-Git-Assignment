-- Images table stores metadata about uploaded images that other tables reference
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

-- Labels table stores all available labels that can be applied to reuse labels across multiple images
CREATE TABLE IF NOT EXISTS labels (
    label_id INTEGER PRIMARY KEY AUTOINCREMENT,
    label_name TEXT NOT NULL UNIQUE,
    label_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Annotations table creates the many-to-many relationship between images and labels 
-- One image can have many labels
-- One label can be applied to many images
CREATE TABLE IF NOT EXISTS annotations (
    annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    confidence REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE,
    UNIQUE(image_id, label_id)
);

-- Index for faster queries when searching by label
CREATE INDEX IF NOT EXISTS idx_annotations_label ON annotations(label_id);

-- Index for faster queries when retrieving annotations for an image
CREATE INDEX IF NOT EXISTS idx_annotations_image ON annotations(image_id);