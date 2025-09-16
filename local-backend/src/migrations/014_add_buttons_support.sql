-- Migration: Add Multiple Buttons Support
-- Date: 2024-09-16
-- Description: Add support for multiple buttons per custom section

-- Add buttons column to custom_sections table
-- This column stores multiple buttons as JSONB array
ALTER TABLE custom_sections ADD COLUMN IF NOT EXISTS buttons JSONB DEFAULT '[]';

-- Update schema_migrations table
INSERT INTO schema_migrations (version, applied_at)
VALUES ('014_add_buttons_support', NOW())
ON CONFLICT (version) DO NOTHING;