-- Add opacity and blur settings to footer
ALTER TABLE public.site_settings 
ADD COLUMN footer_opacity numeric DEFAULT 0.8,
ADD COLUMN footer_blur boolean DEFAULT true,
ADD COLUMN footer_hover_opacity numeric DEFAULT 0.95;