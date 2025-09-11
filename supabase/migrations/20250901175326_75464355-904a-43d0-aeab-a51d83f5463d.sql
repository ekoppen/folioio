-- Add slideshow configuration settings to site_settings table
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_interval integer DEFAULT 6000;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_transition text DEFAULT 'fade';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_info_card_enabled boolean DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_info_card_radius integer DEFAULT 8;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_info_card_opacity numeric DEFAULT 0.8;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_info_card_position text DEFAULT 'bottom-left';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_show_arrows boolean DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_show_dots boolean DEFAULT true;