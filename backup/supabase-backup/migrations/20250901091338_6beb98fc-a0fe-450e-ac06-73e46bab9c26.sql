-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'editor');

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Portfolio',
  site_tagline TEXT DEFAULT '',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2D3748',
  secondary_color TEXT DEFAULT '#F7FAFC',
  accent_color TEXT DEFAULT '#F6D55C',
  custom_font_family TEXT,
  custom_font_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  social_instagram TEXT,
  social_facebook TEXT,
  social_linkedin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create galleries table
CREATE TABLE public.galleries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  cover_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create images table
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table for content management
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slideshow table
CREATE TABLE public.slideshow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slideshow ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = _user_id 
    AND role = 'admin'
  )
$$;

-- Create security definer function to check if user is authenticated admin or editor
CREATE OR REPLACE FUNCTION public.is_authenticated_user(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = _user_id 
    AND role IN ('admin', 'editor')
  )
$$;

-- RLS Policies for site_settings (public read, admin write)
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify site settings" 
ON public.site_settings FOR ALL 
USING (public.is_admin());

-- RLS Policies for profiles (users can view their own, admins can view all)
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_admin());

-- RLS Policies for galleries (public read, authenticated write)
CREATE POLICY "Anyone can view published galleries" 
ON public.galleries FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Authenticated users can view all galleries" 
ON public.galleries FOR SELECT 
USING (public.is_authenticated_user());

CREATE POLICY "Authenticated users can manage galleries" 
ON public.galleries FOR ALL 
USING (public.is_authenticated_user());

-- RLS Policies for images (public read, authenticated write)
CREATE POLICY "Anyone can view images from visible galleries" 
ON public.images FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.galleries 
    WHERE galleries.id = images.gallery_id 
    AND galleries.is_visible = true
  )
);

CREATE POLICY "Authenticated users can view all images" 
ON public.images FOR SELECT 
USING (public.is_authenticated_user());

CREATE POLICY "Authenticated users can manage images" 
ON public.images FOR ALL 
USING (public.is_authenticated_user());

-- RLS Policies for pages (public read published, authenticated write)
CREATE POLICY "Anyone can view published pages" 
ON public.pages FOR SELECT 
USING (is_published = true);

CREATE POLICY "Authenticated users can view all pages" 
ON public.pages FOR SELECT 
USING (public.is_authenticated_user());

CREATE POLICY "Authenticated users can manage pages" 
ON public.pages FOR ALL 
USING (public.is_authenticated_user());

-- RLS Policies for slideshow (public read active, authenticated write)
CREATE POLICY "Anyone can view active slideshow items" 
ON public.slideshow FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can view all slideshow items" 
ON public.slideshow FOR SELECT 
USING (public.is_authenticated_user());

CREATE POLICY "Authenticated users can manage slideshow" 
ON public.slideshow FOR ALL 
USING (public.is_authenticated_user());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('logos', 'logos', true),
('gallery-images', 'gallery-images', true),
('slideshow-images', 'slideshow-images', true),
('custom-fonts', 'custom-fonts', true);

-- Storage policies for logos bucket
CREATE POLICY "Anyone can view logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND public.is_authenticated_user());

CREATE POLICY "Authenticated users can update logos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'logos' AND public.is_authenticated_user());

CREATE POLICY "Authenticated users can delete logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'logos' AND public.is_authenticated_user());

-- Storage policies for gallery-images bucket
CREATE POLICY "Anyone can view gallery images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gallery-images');

CREATE POLICY "Authenticated users can upload gallery images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'gallery-images' AND public.is_authenticated_user());

CREATE POLICY "Authenticated users can update gallery images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'gallery-images' AND public.is_authenticated_user());

CREATE POLICY "Authenticated users can delete gallery images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'gallery-images' AND public.is_authenticated_user());

-- Storage policies for slideshow-images bucket
CREATE POLICY "Anyone can view slideshow images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'slideshow-images');

CREATE POLICY "Authenticated users can upload slideshow images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'slideshow-images' AND public.is_authenticated_user());

CREATE POLICY "Authenticated users can update slideshow images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'slideshow-images' AND public.is_authenticated_user());

CREATE POLICY "Authenticated users can delete slideshow images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'slideshow-images' AND public.is_authenticated_user());

-- Storage policies for custom-fonts bucket
CREATE POLICY "Anyone can view custom fonts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'custom-fonts');

CREATE POLICY "Admins can upload custom fonts" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'custom-fonts' AND public.is_admin());

CREATE POLICY "Admins can update custom fonts" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'custom-fonts' AND public.is_admin());

CREATE POLICY "Admins can delete custom fonts" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'custom-fonts' AND public.is_admin());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'editor'::user_role
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slideshow_updated_at
  BEFORE UPDATE ON public.slideshow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (
  site_title,
  site_tagline,
  primary_color,
  secondary_color,
  accent_color,
  contact_email
) VALUES (
  'Portfolio',
  'Capturing moments, creating memories',
  '#2D3748',
  '#F7FAFC', 
  '#F6D55C',
  'hello@portfolio.com'
);

-- Insert some default galleries
INSERT INTO public.galleries (name, description, category, is_visible) VALUES 
('Nature Photography', 'Beautiful landscapes and nature shots', 'photography', true),
('Portrait Work', 'Professional portrait photography', 'photography', true),
('Digital Art', 'Creative digital artwork and designs', 'art', true);