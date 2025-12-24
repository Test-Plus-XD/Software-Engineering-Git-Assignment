-- Migration: Add creator and editor tracking fields
-- This migration adds nullable fields to track who created and last edited records

-- Add creator and editor fields to images table
ALTER TABLE images ADD COLUMN created_by TEXT NULL;
ALTER TABLE images ADD COLUMN last_edited_by TEXT NULL;

-- Add creator and editor fields to annotations table
ALTER TABLE annotations ADD COLUMN created_by TEXT NULL;
ALTER TABLE annotations ADD COLUMN last_edited_by TEXT NULL;

-- Update existing records to have 'system' as the creator for historical data
UPDATE images SET created_by = 'system' WHERE created_by IS NULL;
UPDATE annotations SET created_by = 'system' WHERE created_by IS NULL;