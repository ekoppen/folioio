-- Add footer settings to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN footer_text text DEFAULT '© 2025 Portfolio. Alle rechten voorbehouden.',
ADD COLUMN footer_height integer DEFAULT 80,
ADD COLUMN footer_font_family text DEFAULT 'Roboto',
ADD COLUMN footer_font_size integer DEFAULT 14,
ADD COLUMN footer_color text DEFAULT '#ffffff',
ADD COLUMN footer_background_color text DEFAULT '#2D3748',
ADD COLUMN footer_text_align text DEFAULT 'center' CHECK (footer_text_align IN ('left', 'center', 'right')),
ADD COLUMN footer_overlay boolean DEFAULT false;