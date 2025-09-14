-- Add logo height setting to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_height integer DEFAULT 32;