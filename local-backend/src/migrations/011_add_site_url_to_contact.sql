-- Add site_url field to site_settings for email links
-- This allows admins to configure the site URL used in email templates

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_url TEXT DEFAULT 'http://localhost:8080';

-- Update the description
COMMENT ON COLUMN site_settings.site_url IS 'Base URL of the website used in email templates and links';