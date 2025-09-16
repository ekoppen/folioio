-- Migration: Add Grid Content System and Background Colors
-- Date: 2024-09-16
-- Description: Add support for flexible grid-based content elements and background colors for sections

-- Add content_elements column to about_settings table
-- This column stores the grid-based content elements as JSONB
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS content_elements JSONB DEFAULT '[]';

-- Add background_color column to about_settings table
-- This allows custom background colors for the About section
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS background_color TEXT;

-- Add content_elements column to custom_sections table
-- This column stores the grid-based content elements as JSONB
ALTER TABLE custom_sections ADD COLUMN IF NOT EXISTS content_elements JSONB DEFAULT '[]';

-- Add background_color column to custom_sections table
-- This allows custom background colors for each custom section
ALTER TABLE custom_sections ADD COLUMN IF NOT EXISTS background_color TEXT;

-- Create index on content_elements for faster queries
CREATE INDEX IF NOT EXISTS idx_about_settings_content_elements ON about_settings USING gin (content_elements);
CREATE INDEX IF NOT EXISTS idx_custom_sections_content_elements ON custom_sections USING gin (content_elements);

-- Update schema_migrations table
INSERT INTO schema_migrations (version, applied_at)
VALUES ('013_add_grid_content_system', NOW())
ON CONFLICT (version) DO NOTHING;