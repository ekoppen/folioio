-- Add quotes array column to about_settings table
ALTER TABLE about_settings
ADD COLUMN IF NOT EXISTS quotes jsonb DEFAULT '[]'::jsonb;

-- Migrate existing quote data to the new quotes array format
UPDATE about_settings
SET quotes = jsonb_build_array(
  jsonb_build_object(
    'text', quote_text,
    'author', quote_author
  )
)
WHERE quote_text IS NOT NULL
  AND quote_text != ''
  AND quotes = '[]'::jsonb;