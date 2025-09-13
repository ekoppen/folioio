-- Migration 007 SAFE: Add missing hero and tagline columns WITHOUT default data
-- This version ONLY adds columns and does NOT set any default values
-- User data is preserved and not overwritten

-- Add missing columns to site_settings table (NO DEFAULTS TO PREVENT OVERWRITE)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_title TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS tagline_font_family VARCHAR(100),
ADD COLUMN IF NOT EXISTS tagline_font_size INTEGER,
ADD COLUMN IF NOT EXISTS tagline_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS tagline_text_align VARCHAR(10),
ADD COLUMN IF NOT EXISTS title_visible BOOLEAN,
ADD COLUMN IF NOT EXISTS tagline_visible BOOLEAN,
ADD COLUMN IF NOT EXISTS title_font_size INTEGER,
ADD COLUMN IF NOT EXISTS title_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS title_position VARCHAR(10),
ADD COLUMN IF NOT EXISTS tagline_position VARCHAR(10);

-- IMPORTANT: NO UPDATE STATEMENTS
-- This prevents overwriting existing user data
-- Columns will be NULL for existing records, which is safe

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_site_settings_header_title ON site_settings(header_title);