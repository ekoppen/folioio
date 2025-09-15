-- Add URL field to services in about_settings
-- Since services is stored as JSONB, we need to update the structure

-- This migration doesn't alter the column structure but documents the new field
-- The application code will handle the new 'url' field in the services JSONB array

-- Example of the new services structure:
-- [
--   {
--     "icon": "Palette",
--     "title": "Service Title",
--     "description": "Service Description",
--     "url": "https://example.com"  -- NEW FIELD (optional)
--   }
-- ]

-- No database changes needed since services is already JSONB
-- The application code has been updated to handle the new field