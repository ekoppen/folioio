-- Remove galleries system and enhance settings with font support
DROP TABLE IF EXISTS galleries CASCADE;
DROP TABLE IF EXISTS images CASCADE;

-- Add font settings to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS title_font_family text,
ADD COLUMN IF NOT EXISTS title_font_url text,
ADD COLUMN IF NOT EXISTS content_font_family text, 
ADD COLUMN IF NOT EXISTS content_font_url text;