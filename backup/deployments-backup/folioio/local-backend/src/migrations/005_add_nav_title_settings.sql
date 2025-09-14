-- Add all missing navigation title and tagline columns to site_settings table
-- These columns are needed for the navigation title/tagline customization feature

-- Navigation title settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_visible boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_color text DEFAULT '#ffffff';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_font_family text DEFAULT NULL;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_font_url text DEFAULT NULL;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_font_size integer DEFAULT 24;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_margin_top integer DEFAULT 0;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_margin_left integer DEFAULT 0;

-- Navigation tagline settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_visible boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_color text DEFAULT '#e0e0e0';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_font_family text DEFAULT NULL;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_font_url text DEFAULT NULL;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_font_size integer DEFAULT 14;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_margin_top integer DEFAULT 4;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_margin_left integer DEFAULT 0;

-- Text shadow setting for both title and tagline
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_text_shadow boolean DEFAULT false;