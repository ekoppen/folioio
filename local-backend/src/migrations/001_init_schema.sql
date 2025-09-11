-- Portfolio Local Backend Database Schema
-- Based on Supabase schema, adapted for PostgreSQL

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create auth schema for user management
CREATE SCHEMA IF NOT EXISTS auth;

-- Users table (simplified auth.users equivalent)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token TEXT,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new TEXT,
  email_change TEXT,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change TEXT,
  phone_change_token TEXT,
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  email_change_token_current TEXT DEFAULT '',
  email_change_confirm_status SMALLINT DEFAULT 0,
  banned_until TIMESTAMPTZ,
  reauthentication_token TEXT,
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  title_font_family TEXT,
  title_font_url TEXT,
  content_font_family TEXT,
  content_font_url TEXT,
  slideshow_show_arrows BOOLEAN DEFAULT TRUE,
  slideshow_show_dots BOOLEAN DEFAULT TRUE,
  slideshow_interval INTEGER DEFAULT 6000,
  slideshow_transition TEXT DEFAULT 'fade',
  slideshow_info_card_enabled BOOLEAN DEFAULT TRUE,
  slideshow_info_card_position TEXT DEFAULT 'bottom-left',
  slideshow_info_card_opacity NUMERIC DEFAULT 0.8,
  slideshow_info_card_radius INTEGER DEFAULT 8,
  slideshow_info_card_text_size INTEGER DEFAULT 14,
  home_show_buttons BOOLEAN DEFAULT TRUE,
  home_show_title_overlay BOOLEAN DEFAULT TRUE,
  portfolio_enabled BOOLEAN DEFAULT TRUE,
  portfolio_title TEXT DEFAULT 'Mijn Portfolio',
  portfolio_description TEXT DEFAULT 'Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen.',
  logo_position TEXT DEFAULT 'left',
  logo_height INTEGER DEFAULT 32,
  logo_margin_top INTEGER DEFAULT 0,
  logo_margin_left INTEGER DEFAULT 0,
  logo_shadow BOOLEAN DEFAULT FALSE,
  header_transparent BOOLEAN DEFAULT TRUE,
  header_blur BOOLEAN DEFAULT TRUE,
  header_background_opacity NUMERIC DEFAULT 0.8,
  show_site_title BOOLEAN DEFAULT TRUE,
  footer_enabled BOOLEAN DEFAULT TRUE,
  footer_height INTEGER DEFAULT 80,
  footer_text TEXT DEFAULT '© 2025 Portfolio. Alle rechten voorbehouden.',
  footer_color TEXT DEFAULT '#ffffff',
  footer_background_color TEXT DEFAULT '#2D3748',
  footer_font_family TEXT DEFAULT 'Roboto',
  footer_font_size INTEGER DEFAULT 14,
  footer_text_align TEXT DEFAULT 'center',
  footer_opacity NUMERIC DEFAULT 0.8,
  footer_blur BOOLEAN DEFAULT TRUE,
  footer_hover_opacity NUMERIC DEFAULT 0.95,
  footer_overlay BOOLEAN DEFAULT FALSE,
  openai_api_key TEXT,
  default_language TEXT DEFAULT 'nl',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  translation_value TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  field_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_photo_id UUID,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  show_title_in_slideshow BOOLEAN DEFAULT TRUE,
  show_description_in_slideshow BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Slideshow table
CREATE TABLE IF NOT EXISTS public.slideshow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pages table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Page builder pages table
CREATE TABLE IF NOT EXISTS public.page_builder_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  is_homepage BOOLEAN DEFAULT FALSE,
  template_category TEXT,
  parent_page_id UUID REFERENCES public.page_builder_pages(id) ON DELETE SET NULL,
  menu_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Page builder elements table
CREATE TABLE IF NOT EXISTS public.page_builder_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.page_builder_pages(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  content TEXT,
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  size_width NUMERIC NOT NULL DEFAULT 100,
  size_height NUMERIC NOT NULL DEFAULT 100,
  styles JSONB DEFAULT '{}',
  responsive_styles JSONB DEFAULT '{}',
  parent_element_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Footer elements table
CREATE TABLE IF NOT EXISTS public.footer_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  content TEXT,
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  size_width NUMERIC NOT NULL DEFAULT 100,
  size_height NUMERIC NOT NULL DEFAULT 60,
  styles JSONB DEFAULT '{}',
  responsive_styles JSONB DEFAULT '{}',
  parent_element_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- About settings table
CREATE TABLE IF NOT EXISTS public.about_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_title TEXT NOT NULL DEFAULT 'Over Mij',
  intro_text TEXT NOT NULL DEFAULT 'Hallo! Ik ben een gepassioneerde creatieve professional die graag verhalen vertelt door middel van visuele kunst, fotografie en digitaal ontwerp. Met meer dan 5 jaar ervaring help ik klanten hun visie tot leven te brengen.',
  description_text TEXT NOT NULL DEFAULT 'Mijn werk wordt gedreven door nieuwsgierigheid en de wens om betekenisvolle verbindingen te maken tussen mensen en merken. Elke project is een nieuwe kans om iets unieks te creëren.',
  profile_photo_url TEXT,
  quote_text TEXT NOT NULL DEFAULT 'Creativiteit is niet wat je ziet, maar wat je anderen laat zien.',
  quote_author TEXT NOT NULL DEFAULT 'Edgar Degas',
  stats JSONB NOT NULL DEFAULT '[{"label": "Projecten", "number": "50+"}, {"label": "Tevreden Klanten", "number": "25+"}, {"label": "Jaar Ervaring", "number": "5+"}]',
  services JSONB NOT NULL DEFAULT '[{"icon": "Palette", "title": "Creatief Ontwerp", "description": "Van concept tot uitvoering, ik creëer visuele identiteiten die impact maken."}, {"icon": "Camera", "title": "Fotografie", "description": "Professionele fotografie voor portretten, evenementen en commerciële doeleinden."}, {"icon": "Laptop", "title": "Digitale Oplossingen", "description": "Websites en digitale ervaringen die gebruikers boeien en converteren."}]',
  skills JSONB NOT NULL DEFAULT '["Fotografie", "Grafisch Ontwerp", "Web Development", "Digitale Kunst", "UI/UX Design"]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact settings table
CREATE TABLE IF NOT EXISTS public.contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email TEXT NOT NULL DEFAULT 'contact@example.com',
  contact_phone TEXT,
  contact_address TEXT,
  form_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_reply_subject TEXT NOT NULL DEFAULT 'Bedankt voor je bericht',
  auto_reply_message TEXT NOT NULL DEFAULT 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON public.photos(album_id);
CREATE INDEX IF NOT EXISTS idx_albums_slug ON public.albums(slug);
CREATE INDEX IF NOT EXISTS idx_albums_visible ON public.albums(is_visible);
CREATE INDEX IF NOT EXISTS idx_photos_visible ON public.photos(is_visible);
CREATE INDEX IF NOT EXISTS idx_slideshow_active ON public.slideshow(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_published ON public.pages(is_published);
CREATE INDEX IF NOT EXISTS idx_page_builder_pages_slug ON public.page_builder_pages(slug);
CREATE INDEX IF NOT EXISTS idx_page_builder_elements_page_id ON public.page_builder_elements(page_id);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON public.translations(translation_key, language_code);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON public.contact_messages(is_read);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON public.languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON public.translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON public.photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slideshow_updated_at BEFORE UPDATE ON public.slideshow FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_page_builder_pages_updated_at BEFORE UPDATE ON public.page_builder_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_page_builder_elements_updated_at BEFORE UPDATE ON public.page_builder_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_footer_elements_updated_at BEFORE UPDATE ON public.footer_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_about_settings_updated_at BEFORE UPDATE ON public.about_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_settings_updated_at BEFORE UPDATE ON public.contact_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO public.languages (code, name, is_enabled, is_default) 
VALUES ('nl', 'Nederlands', true, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.site_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;

INSERT INTO public.about_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;

INSERT INTO public.contact_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- Create utility functions
CREATE OR REPLACE FUNCTION is_admin(_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = COALESCE(_user_id, (SELECT id FROM auth.users WHERE id = _user_id LIMIT 1))
    AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION is_authenticated_user(_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = COALESCE(_user_id, (SELECT id FROM auth.users WHERE id = _user_id LIMIT 1))
    AND role IN ('admin', 'editor')
  )
$$;

-- Create profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create promotion function
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'::user_role
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;