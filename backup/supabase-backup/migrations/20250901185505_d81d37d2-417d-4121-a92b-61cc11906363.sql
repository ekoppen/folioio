-- Add profile photo column to about_settings table
ALTER TABLE public.about_settings 
ADD COLUMN profile_photo_url TEXT;