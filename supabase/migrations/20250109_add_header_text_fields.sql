-- Add header text fields to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_title text,
ADD COLUMN IF NOT EXISTS header_subtitle text,
ADD COLUMN IF NOT EXISTS header_description text;

-- Set default values for existing records
UPDATE site_settings 
SET 
  header_title = COALESCE(header_title, site_title),
  header_subtitle = COALESCE(header_subtitle, site_tagline),
  header_description = COALESCE(header_description, '')
WHERE header_title IS NULL OR header_subtitle IS NULL;