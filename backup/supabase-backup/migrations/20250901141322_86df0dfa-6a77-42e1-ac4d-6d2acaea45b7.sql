-- Create table for footer elements (similar to page elements but for footer)
CREATE TABLE public.footer_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  element_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,  
  size_width NUMERIC NOT NULL DEFAULT 100,
  size_height NUMERIC NOT NULL DEFAULT 60,
  content TEXT,
  styles JSONB DEFAULT '{}'::jsonb,
  responsive_styles JSONB DEFAULT '{}'::jsonb,
  parent_element_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.footer_elements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for footer elements
CREATE POLICY "Anyone can view footer elements" 
ON public.footer_elements 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage footer elements" 
ON public.footer_elements 
FOR ALL 
USING (is_authenticated_user());

-- Add header/footer settings to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN header_transparent BOOLEAN DEFAULT true,
ADD COLUMN header_blur BOOLEAN DEFAULT true,
ADD COLUMN header_background_opacity NUMERIC DEFAULT 0.8,
ADD COLUMN show_site_title BOOLEAN DEFAULT true,
ADD COLUMN footer_enabled BOOLEAN DEFAULT true;

-- Trigger for updated_at
CREATE TRIGGER update_footer_elements_updated_at
BEFORE UPDATE ON public.footer_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();