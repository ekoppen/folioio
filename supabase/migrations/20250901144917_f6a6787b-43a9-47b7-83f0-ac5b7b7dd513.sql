-- Add home-specific settings and accent color to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS home_show_title_overlay boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS home_show_buttons boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS portfolio_title text DEFAULT 'Mijn Portfolio',
ADD COLUMN IF NOT EXISTS portfolio_description text DEFAULT 'Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen.',
ADD COLUMN IF NOT EXISTS portfolio_enabled boolean DEFAULT true;