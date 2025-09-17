-- Migration: Add album_object_fit column to albums table
-- Date: 2025-09-17
-- Purpose: Allow per-album configuration of object-fit CSS property for slideshow images

BEGIN;

-- Add album_object_fit column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'albums'
        AND column_name = 'album_object_fit'
    ) THEN
        ALTER TABLE albums
        ADD COLUMN album_object_fit VARCHAR(20) DEFAULT NULL;

        RAISE NOTICE 'Added album_object_fit column to albums table';
    ELSE
        RAISE NOTICE 'Column album_object_fit already exists in albums table';
    END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN albums.album_object_fit IS 'Override object-fit setting for this album. NULL = use site_settings.slideshow_object_fit';

COMMIT;