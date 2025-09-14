-- Add show_logo column to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS show_logo boolean DEFAULT true;

-- Also ensure nav_logo_visible exists (alternative naming)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_logo_visible boolean DEFAULT true;