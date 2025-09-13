-- Migration 007: Add missing hero and tagline columns
-- Adds columns that were missing and causing 500 errors when saving settings

-- Add missing columns to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_title TEXT DEFAULT 'Portfolio',
ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'Welkom op mijn portfolio',
ADD COLUMN IF NOT EXISTS tagline_font_family VARCHAR(100) DEFAULT 'site',
ADD COLUMN IF NOT EXISTS tagline_font_size INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS tagline_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS tagline_text_align VARCHAR(10) DEFAULT 'center',
ADD COLUMN IF NOT EXISTS title_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tagline_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS title_font_size INTEGER DEFAULT 56,
ADD COLUMN IF NOT EXISTS title_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS title_position VARCHAR(10) DEFAULT 'center',
ADD COLUMN IF NOT EXISTS tagline_position VARCHAR(10) DEFAULT 'center';

-- Update existing rows to have default values ONLY if they are NULL
UPDATE site_settings 
SET 
    header_title = 'Portfolio'
WHERE header_title IS NULL;

UPDATE site_settings 
SET 
    tagline = 'Welkom op mijn portfolio'
WHERE tagline IS NULL;

UPDATE site_settings 
SET 
    tagline_font_family = 'site'
WHERE tagline_font_family IS NULL;

UPDATE site_settings 
SET 
    tagline_font_size = 18
WHERE tagline_font_size IS NULL;

UPDATE site_settings 
SET 
    tagline_color = '#ffffff'
WHERE tagline_color IS NULL;

UPDATE site_settings 
SET 
    tagline_text_align = 'center'
WHERE tagline_text_align IS NULL;

UPDATE site_settings 
SET 
    title_visible = true
WHERE title_visible IS NULL;

UPDATE site_settings 
SET 
    tagline_visible = true
WHERE tagline_visible IS NULL;

UPDATE site_settings 
SET 
    title_font_size = 56
WHERE title_font_size IS NULL;

UPDATE site_settings 
SET 
    title_color = '#ffffff'
WHERE title_color IS NULL;

UPDATE site_settings 
SET 
    title_position = 'center'
WHERE title_position IS NULL;

UPDATE site_settings 
SET 
    tagline_position = 'center'
WHERE tagline_position IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_site_settings_header_title ON site_settings(header_title);