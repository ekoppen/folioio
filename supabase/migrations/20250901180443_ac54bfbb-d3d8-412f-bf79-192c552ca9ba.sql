-- Add text size setting for slideshow info card
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS slideshow_info_card_text_size integer DEFAULT 14;