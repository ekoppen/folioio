-- Migration: Add slideshow_object_fit column to site_settings table
-- Date: 2025-09-16
-- Purpose: Allow configuration of object-fit CSS property for slideshow images

BEGIN;

-- Add slideshow_object_fit column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'site_settings'
        AND column_name = 'slideshow_object_fit'
    ) THEN
        ALTER TABLE site_settings
        ADD COLUMN slideshow_object_fit VARCHAR(20) DEFAULT 'cover';

        RAISE NOTICE 'Added slideshow_object_fit column to site_settings table';
    ELSE
        RAISE NOTICE 'Column slideshow_object_fit already exists in site_settings table';
    END IF;
END $$;

COMMIT;