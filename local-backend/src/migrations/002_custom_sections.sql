-- Custom sections feature migration
-- Adds support for dynamic custom sections on homepage

-- Create custom sections table
CREATE TABLE IF NOT EXISTS public.custom_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  show_in_navigation BOOLEAN DEFAULT true,
  show_hero_button BOOLEAN DEFAULT false,
  menu_order INTEGER DEFAULT 0,
  header_image_url TEXT,
  content_left TEXT,
  content_right JSONB DEFAULT '[]'::jsonb,
  button_text TEXT,
  button_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_sections_active ON public.custom_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_sections_menu_order ON public.custom_sections(menu_order);
CREATE INDEX IF NOT EXISTS idx_custom_sections_slug ON public.custom_sections(slug);
CREATE INDEX IF NOT EXISTS idx_custom_sections_navigation ON public.custom_sections(show_in_navigation, is_active, menu_order);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_custom_sections_updated_at ON public.custom_sections;
CREATE TRIGGER update_custom_sections_updated_at 
  BEFORE UPDATE ON public.custom_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- No default custom sections - let users create their own