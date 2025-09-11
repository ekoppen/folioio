-- Add logo positioning and styling settings to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_position text DEFAULT 'left',
ADD COLUMN IF NOT EXISTS logo_margin_top integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS logo_margin_left integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS logo_shadow boolean DEFAULT false;