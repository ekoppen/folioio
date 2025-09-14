-- Fix URL encoding in file URLs
-- Replace %2F with / in photo file_url column

UPDATE photos SET file_url = REPLACE(file_url, '%2F', '/') WHERE file_url LIKE '%25%2F%25';

-- Add any future encoding fixes here as needed