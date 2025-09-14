-- Create languages table
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- e.g., 'en', 'fr', 'nl'
  name TEXT NOT NULL, -- e.g., 'English', 'Français', 'Nederlands'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create translations table
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL,
  translation_key TEXT NOT NULL, -- e.g., 'site_settings.site_title'
  translation_value TEXT NOT NULL,
  table_name TEXT, -- source table name for dynamic content
  record_id UUID, -- source record id for dynamic content
  field_name TEXT, -- source field name for dynamic content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(language_code, translation_key, table_name, record_id, field_name)
);

-- Add OpenAI API key to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN openai_api_key TEXT,
ADD COLUMN default_language TEXT DEFAULT 'nl';

-- Insert default Dutch language
INSERT INTO public.languages (code, name, is_default, is_enabled) 
VALUES ('nl', 'Nederlands', true, true);

-- Enable RLS on new tables
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Create policies for languages table
CREATE POLICY "Anyone can view enabled languages" 
ON public.languages 
FOR SELECT 
USING (is_enabled = true);

CREATE POLICY "Authenticated users can view all languages" 
ON public.languages 
FOR SELECT 
USING (is_authenticated_user());

CREATE POLICY "Admins can manage languages" 
ON public.languages 
FOR ALL 
USING (is_admin());

-- Create policies for translations table  
CREATE POLICY "Anyone can view translations" 
ON public.translations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage translations" 
ON public.translations 
FOR ALL 
USING (is_authenticated_user());

-- Create indexes for better performance
CREATE INDEX idx_translations_language_key ON public.translations(language_code, translation_key);
CREATE INDEX idx_translations_table_record ON public.translations(table_name, record_id, field_name);

-- Add trigger for updated_at on languages
CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on translations  
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();