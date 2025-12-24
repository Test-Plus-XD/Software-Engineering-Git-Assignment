-- Sample data for testing the AI Dataset Annotation Tool v2
-- Seed: 001_sample_data
-- This file populates the database with example labels and simulated image records

-- Insert sample labels
-- These represent common categories for image classification
INSERT OR IGNORE INTO labels (label_name, label_description) VALUES
    ('cat', 'Domestic feline animals'),
    ('dog', 'Domestic canine animals'),
    ('animal', 'General animal category'),
    ('person', 'Human beings'),
    ('vehicle', 'Cars, trucks, motorcycles, etc.'),
    ('building', 'Structures and architecture'),
    ('nature', 'Natural landscapes and scenes'),
    ('food', 'Edible items and meals'),
    ('technology', 'Electronic devices and gadgets'),
    ('indoor', 'Interior scenes'),
    ('outdoor', 'Exterior scenes'),
    ('portrait', 'Close-up of person or animal'),
    ('landscape', 'Wide natural or urban scenes');

-- Insert sample image records
-- The file paths use Firebase Storage URLs for remote image hosting
INSERT OR IGNORE INTO images (filename, original_name, file_path, file_size, mime_type) VALUES
    ('sample-cat-001.jpg', 'my_cat.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-cat-001.jpg?alt=media&token=9789c13a-9fe9-492b-86cd-ce8018511f48', 245760, 'image/jpeg'),
    ('sample-dog-001.jpg', 'golden_retriever.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-dog-001.jpg?alt=media&token=92137c9b-8346-48e3-ada8-0753f59cf93c', 312450, 'image/jpeg'),
    ('sample-landscape-001.jpg', 'mountain_view.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-landscape-001.jpg?alt=media&token=db1e3a03-bdcf-42cc-970c-0f6820328dcd', 456789, 'image/jpeg'),
    ('sample-person-001.jpg', 'portrait_photo.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-person-001.jpg?alt=media&token=b184f9aa-5c18-4f99-a909-f61e7dfd437d', 198765, 'image/jpeg'),
    ('sample-food-001.jpg', 'lunch_plate.jpg', 'https://firebasestorage.googleapis.com/v0/b/cross-platform-assignmen-b97cc.firebasestorage.app/o/Annotations%2Fsample-food-001.jpg?alt=media&token=00686225-78cb-4767-bae4-e8e17e710395', 287654, 'image/jpeg');

-- Insert sample annotations linking images to labels
-- These create the many-to-many relationships demonstrating how one image can have multiple labels
INSERT OR IGNORE INTO annotations (image_id, label_id, confidence) VALUES
    -- Cat image annotations
    (1, 1, 1.0),  -- cat label
    (1, 3, 0.95), -- animal label
    (1, 10, 0.8), -- indoor label
    
    -- Dog image annotations
    (2, 2, 1.0),  -- dog label
    (2, 3, 0.98), -- animal label
    (2, 11, 0.9), -- outdoor label
    
    -- Landscape image annotations
    (3, 7, 1.0),  -- nature label
    (3, 11, 1.0), -- outdoor label
    (3, 13, 0.95),-- landscape label
    
    -- Person image annotations
    (4, 4, 1.0),  -- person label
    (4, 12, 0.85),-- portrait label
    (4, 10, 0.7), -- indoor label
    
    -- Food image annotations
    (5, 8, 1.0),  -- food label
    (5, 10, 0.9); -- indoor label