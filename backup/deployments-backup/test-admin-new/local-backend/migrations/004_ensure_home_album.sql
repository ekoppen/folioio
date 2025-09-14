-- Ensure home album exists with hero background image
-- This migration ensures backwards compatibility for existing deployments

-- Create default home album for hero slideshow if it doesn't exist
INSERT INTO public.albums (name, slug, description, is_visible, sort_order) 
VALUES ('Home', 'home', 'Homepage slideshow album', true, 1)
ON CONFLICT (slug) DO NOTHING;

-- Add hero background image to home album if it doesn't exist
INSERT INTO public.photos (filename, file_url, alt_text, caption, album_id, is_visible, sort_order)
SELECT 'hero-background.jpg', '/assets/hero-background-Bb9SWMSw.jpg', 'Hero background', 'Beautiful gradient background', a.id, true, 1
FROM public.albums a
WHERE a.slug = 'home'
AND NOT EXISTS (SELECT 1 FROM public.photos p WHERE p.album_id = a.id AND p.filename = 'hero-background.jpg');