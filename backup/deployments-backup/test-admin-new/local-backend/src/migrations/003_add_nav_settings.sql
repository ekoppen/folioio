-- Migration 003: Add navigation and album settings
-- This migration adds navigation title/tagline controls and album timer settings

-- Add navigation title and tagline settings to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS nav_title_font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS nav_title_font_url text,
ADD COLUMN IF NOT EXISTS nav_title_font_size integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS nav_title_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS nav_title_margin_top integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nav_title_margin_left integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nav_tagline_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nav_tagline_font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS nav_tagline_font_url text,
ADD COLUMN IF NOT EXISTS nav_tagline_font_size integer DEFAULT 16,
ADD COLUMN IF NOT EXISTS nav_tagline_color text DEFAULT '#cccccc',
ADD COLUMN IF NOT EXISTS nav_tagline_margin_top integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nav_tagline_margin_left integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nav_text_shadow boolean DEFAULT false;

-- Add album timer settings for slideshow display
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS show_title_in_slideshow boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_description_in_slideshow boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS title_display_duration integer DEFAULT -1,
ADD COLUMN IF NOT EXISTS description_display_duration integer DEFAULT -1;

-- Create index for faster lookups on navigation settings
CREATE INDEX IF NOT EXISTS idx_site_settings_nav ON site_settings(nav_title_visible, nav_tagline_visible);

-- Migration completed
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('003', NOW())
ON CONFLICT (version) DO NOTHING;