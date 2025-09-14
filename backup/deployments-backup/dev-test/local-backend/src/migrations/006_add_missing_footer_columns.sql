-- Add missing columns for footer and header settings that are referenced in SimplifiedFooter.tsx
-- These columns are used but were never created in the initial schema

-- Header/Navigation background settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_background_color text DEFAULT '#000000';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_background_opacity numeric DEFAULT 0.8;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_blur boolean DEFAULT false;

-- Font family settings for site-wide typography
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS title_font_family text DEFAULT 'Playfair Display';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS content_font_family text DEFAULT 'Roboto';

-- Add comments for clarity
COMMENT ON COLUMN site_settings.header_background_color IS 'Background color for navigation header';
COMMENT ON COLUMN site_settings.header_background_opacity IS 'Opacity level for navigation header background';
COMMENT ON COLUMN site_settings.header_blur IS 'Enable blur effect on navigation header background';
COMMENT ON COLUMN site_settings.title_font_family IS 'Font family for site titles';
COMMENT ON COLUMN site_settings.content_font_family IS 'Font family for site content text';