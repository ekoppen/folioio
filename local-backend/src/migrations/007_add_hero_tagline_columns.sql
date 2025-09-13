-- Migration 007: Add missing hero and tagline columns
-- Adds columns that were missing and causing 500 errors when saving settings

-- Add missing columns to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_title TEXT DEFAULT 'Portfolio',
ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'Welkom op mijn portfolio',
ADD COLUMN IF NOT EXISTS tagline_font_family VARCHAR(100) DEFAULT 'site',
ADD COLUMN IF NOT EXISTS tagline_font_size INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS tagline_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS tagline_text_align VARCHAR(10) DEFAULT 'center';

-- Update existing rows to have default values if they exist
UPDATE site_settings 
SET 
    header_title = COALESCE(header_title, 'Portfolio'),
    tagline = COALESCE(tagline, 'Welkom op mijn portfolio'),
    tagline_font_family = COALESCE(tagline_font_family, 'site'),
    tagline_font_size = COALESCE(tagline_font_size, 18),
    tagline_color = COALESCE(tagline_color, '#ffffff'),
    tagline_text_align = COALESCE(tagline_text_align, 'center')
WHERE id IS NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_site_settings_header_title ON site_settings(header_title);