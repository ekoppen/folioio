-- ====================================================
-- COMPLETE DATABASE SCHEMA - Portfolio Local Backend
-- ====================================================
-- Generated from consolidated migrations
-- Use for fresh installations instead of running all migrations
-- For existing databases, continue using migration system

-- ====================================================
-- SCHEMA MIGRATIONS TRACKING
-- ====================================================

-- Create schema migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(255)
);

-- ====================================================
-- CORE TYPES AND SCHEMAS
-- ====================================================

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create auth schema for user management
CREATE SCHEMA IF NOT EXISTS auth;

-- ====================================================
-- USER MANAGEMENT TABLES
-- ====================================================

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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role user_role DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- ====================================================
-- PORTFOLIO CONTENT TABLES
-- ====================================================

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  menu_order INTEGER DEFAULT 0,
  show_in_navigation BOOLEAN DEFAULT true,
  show_hero_button BOOLEAN DEFAULT false
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  title TEXT,
  description TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Custom sections table
CREATE TABLE IF NOT EXISTS public.custom_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  show_in_navigation BOOLEAN DEFAULT true,
  show_hero_button BOOLEAN DEFAULT false,
  menu_order INTEGER DEFAULT 0,
  header_image_url TEXT,
  content_left TEXT,
  content_right JSONB DEFAULT '[]'::jsonb,
  button_text TEXT,
  button_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- ====================================================
-- SITE CONFIGURATION TABLES
-- ====================================================

-- Site settings table (comprehensive configuration)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id SERIAL PRIMARY KEY,
  accent_color TEXT DEFAULT '#F6D55C',
  site_title TEXT DEFAULT 'Portfolio',
  site_tagline TEXT DEFAULT 'Creative Portfolio',
  show_site_title BOOLEAN DEFAULT true,

  -- Header/Navigation
  header_transparent BOOLEAN DEFAULT false,
  header_blur BOOLEAN DEFAULT false,
  header_background_opacity NUMERIC(3,2) DEFAULT 1.0,
  logo_url TEXT,
  logo_height INTEGER DEFAULT 40,
  logo_position TEXT DEFAULT 'left',
  logo_margin_top INTEGER DEFAULT 0,
  logo_margin_left INTEGER DEFAULT 0,
  logo_shadow BOOLEAN DEFAULT false,
  show_logo BOOLEAN DEFAULT false,

  -- Navigation Text
  nav_title_visible BOOLEAN DEFAULT true,
  nav_title_font_family TEXT DEFAULT 'Inter',
  nav_title_font_url TEXT,
  nav_title_font_size INTEGER DEFAULT 24,
  nav_title_color TEXT DEFAULT '#000000',
  nav_title_margin_top INTEGER DEFAULT 0,
  nav_title_margin_left INTEGER DEFAULT 0,
  nav_tagline_visible BOOLEAN DEFAULT true,
  nav_tagline_font_family TEXT DEFAULT 'Inter',
  nav_tagline_font_url TEXT,
  nav_tagline_font_size INTEGER DEFAULT 14,
  nav_tagline_color TEXT DEFAULT '#666666',
  nav_tagline_margin_top INTEGER DEFAULT 0,
  nav_tagline_margin_left INTEGER DEFAULT 0,
  nav_text_shadow BOOLEAN DEFAULT false,

  -- Typography
  custom_font_family TEXT,
  custom_font_url TEXT,
  title_font_family TEXT,
  title_font_url TEXT,
  content_font_family TEXT,
  content_font_url TEXT,

  -- Hero Section
  tagline_font_family TEXT,
  tagline_font_url TEXT,
  tagline_font_size INTEGER DEFAULT 18,
  tagline_color TEXT DEFAULT '#666666',
  tagline_margin_top INTEGER DEFAULT 0,
  tagline_margin_left INTEGER DEFAULT 0,

  -- Contact Information
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,

  -- Email Service Configuration
  email_service_type VARCHAR(20) DEFAULT 'gmail',
  gmail_user VARCHAR(255),
  gmail_app_password VARCHAR(255),
  resend_api_key VARCHAR(255),

  -- Social Media
  social_instagram TEXT,
  social_facebook TEXT,
  social_linkedin TEXT,

  -- Slideshow Settings
  slideshow_show_arrows BOOLEAN DEFAULT true,
  slideshow_show_dots BOOLEAN DEFAULT true,
  slideshow_autoplay BOOLEAN DEFAULT false,
  slideshow_autoplay_speed INTEGER DEFAULT 3000,
  slideshow_transition_speed INTEGER DEFAULT 500,

  -- Footer Configuration
  footer_height INTEGER DEFAULT 200,
  footer_text TEXT,
  footer_color TEXT DEFAULT '#ffffff',
  footer_background_color TEXT DEFAULT '#000000',
  footer_font_family TEXT DEFAULT 'Roboto',
  footer_background_image TEXT,
  footer_overlay BOOLEAN DEFAULT false,

  -- System
  openai_api_key TEXT,
  default_language TEXT DEFAULT 'en',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================
-- DEFAULT DATA INSERTION
-- ====================================================

-- Insert default site settings if none exist
INSERT INTO public.site_settings (
  accent_color,
  site_title,
  site_tagline,
  show_site_title,
  email_service_type
)
SELECT
  '#F6D55C',
  'Portfolio',
  'Creative Portfolio',
  true,
  'gmail'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- Create default "Home" album if none exists
INSERT INTO public.albums (
  name,
  slug,
  description,
  is_active,
  show_in_navigation,
  menu_order
)
SELECT
  'Home',
  'home',
  'Welcome to my portfolio',
  true,
  false,
  0
WHERE NOT EXISTS (SELECT 1 FROM public.albums WHERE slug = 'home');

-- ====================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON auth.users(deleted_at);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Album indexes
CREATE INDEX IF NOT EXISTS idx_albums_slug ON public.albums(slug);
CREATE INDEX IF NOT EXISTS idx_albums_is_active ON public.albums(is_active);
CREATE INDEX IF NOT EXISTS idx_albums_menu_order ON public.albums(menu_order);
CREATE INDEX IF NOT EXISTS idx_albums_show_in_navigation ON public.albums(show_in_navigation);

-- Photo indexes
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON public.photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_featured ON public.photos(is_featured);
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON public.photos(sort_order);

-- Custom section indexes
CREATE INDEX IF NOT EXISTS idx_custom_sections_slug ON public.custom_sections(slug);
CREATE INDEX IF NOT EXISTS idx_custom_sections_is_active ON public.custom_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_sections_menu_order ON public.custom_sections(menu_order);
CREATE INDEX IF NOT EXISTS idx_custom_sections_show_in_navigation ON public.custom_sections(show_in_navigation);

-- ====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ====================================================

-- Automatic profile creation trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS trigger_create_profile ON auth.users;
CREATE TRIGGER trigger_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_users_updated_at ON auth.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_albums_updated_at ON public.albums;
CREATE TRIGGER trigger_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_photos_updated_at ON public.photos;
CREATE TRIGGER trigger_photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_custom_sections_updated_at ON public.custom_sections;
CREATE TRIGGER trigger_custom_sections_updated_at
  BEFORE UPDATE ON public.custom_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- MIGRATION TRACKING FOR FRESH INSTALLS
-- ====================================================

-- Mark all migrations as applied for fresh installs
-- This prevents the migration system from trying to run them again
INSERT INTO schema_migrations (version, applied_at) VALUES
('000_schema_migrations', NOW()),
('001_init_schema', NOW()),
('002_custom_sections', NOW()),
('002_fix_url_encoding', NOW()),
('003_add_nav_settings', NOW()),
('004_add_show_logo', NOW()),
('005_add_nav_title_settings', NOW()),
('006_add_missing_footer_columns', NOW()),
('007_add_hero_tagline_columns_safe', NOW()),
('008_add_contact_columns_safe', NOW()),
('009_add_email_service_columns', NOW())
ON CONFLICT (version) DO NOTHING;

-- ====================================================
-- COMPLETION
-- ====================================================

-- Log successful schema creation
DO $$
BEGIN
  RAISE NOTICE 'Portfolio database schema created successfully!';
  RAISE NOTICE 'Fresh install complete - all tables, indexes, and triggers ready.';
END $$;