-- Add slideshow display options to albums table
ALTER TABLE public.albums 
ADD COLUMN show_title_in_slideshow boolean DEFAULT true,
ADD COLUMN show_description_in_slideshow boolean DEFAULT true;