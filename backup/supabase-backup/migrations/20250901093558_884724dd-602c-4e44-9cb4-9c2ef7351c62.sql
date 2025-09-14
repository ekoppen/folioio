-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true);

-- Create albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_photo_id UUID,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums
CREATE POLICY "Anyone can view visible albums" 
ON public.albums 
FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Authenticated users can manage albums" 
ON public.albums 
FOR ALL 
USING (is_authenticated_user());

CREATE POLICY "Authenticated users can view all albums" 
ON public.albums 
FOR SELECT 
USING (is_authenticated_user());

-- RLS Policies for photos
CREATE POLICY "Anyone can view photos from visible albums" 
ON public.photos 
FOR SELECT 
USING (is_visible = true AND EXISTS (
  SELECT 1 FROM public.albums 
  WHERE albums.id = photos.album_id 
  AND albums.is_visible = true
));

CREATE POLICY "Authenticated users can manage photos" 
ON public.photos 
FOR ALL 
USING (is_authenticated_user());

CREATE POLICY "Authenticated users can view all photos" 
ON public.photos 
FOR SELECT 
USING (is_authenticated_user());

-- Storage policies for fotos bucket
CREATE POLICY "Anyone can view photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fotos');

CREATE POLICY "Authenticated users can upload photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fotos' AND is_authenticated_user());

CREATE POLICY "Authenticated users can update photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'fotos' AND is_authenticated_user());

CREATE POLICY "Authenticated users can delete photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'fotos' AND is_authenticated_user());

-- Create trigger for albums updated_at
CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for photos updated_at  
CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default "home" album
INSERT INTO public.albums (name, slug, description, sort_order) 
VALUES ('Home', 'home', 'Foto''s voor de homepage', 0);

-- Add foreign key constraint for cover_photo_id after photos table exists
ALTER TABLE public.albums 
ADD CONSTRAINT fk_albums_cover_photo 
FOREIGN KEY (cover_photo_id) REFERENCES public.photos(id) ON DELETE SET NULL;