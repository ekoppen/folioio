-- Create table for page builder pages
CREATE TABLE public.page_builder_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  template_id UUID,
  responsive_settings JSONB DEFAULT '{"mobile": {}, "tablet": {}, "desktop": {}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

-- Create table for page elements
CREATE TABLE public.page_builder_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.page_builder_pages(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN ('text', 'heading', 'button', 'image', 'container', 'video', 'form', 'map', 'social', 'divider', 'spacer', 'icon')),
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}'::jsonb,
  size JSONB NOT NULL DEFAULT '{"width": 300, "height": 200}'::jsonb,
  style JSONB DEFAULT '{}'::jsonb,
  content TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  parent_id UUID REFERENCES public.page_builder_elements(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  breakpoint_styles JSONB DEFAULT '{"mobile": {}, "tablet": {}, "desktop": {}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for page templates
CREATE TABLE public.page_builder_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  preview_image TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_builder_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_builder_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_builder_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for page_builder_pages
CREATE POLICY "Users can view their own pages" ON public.page_builder_pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages" ON public.page_builder_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" ON public.page_builder_pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" ON public.page_builder_pages
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for page_builder_elements
CREATE POLICY "Users can view elements of their pages" ON public.page_builder_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.page_builder_pages p 
      WHERE p.id = page_builder_elements.page_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create elements for their pages" ON public.page_builder_elements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.page_builder_pages p 
      WHERE p.id = page_builder_elements.page_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update elements of their pages" ON public.page_builder_elements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.page_builder_pages p 
      WHERE p.id = page_builder_elements.page_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete elements of their pages" ON public.page_builder_elements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.page_builder_pages p 
      WHERE p.id = page_builder_elements.page_id AND p.user_id = auth.uid()
    )
  );

-- Create policies for page_builder_templates
CREATE POLICY "Everyone can view public templates" ON public.page_builder_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON public.page_builder_templates
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own templates" ON public.page_builder_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON public.page_builder_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON public.page_builder_templates
  FOR DELETE USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_page_builder_pages_user_id ON public.page_builder_pages(user_id);
CREATE INDEX idx_page_builder_pages_slug ON public.page_builder_pages(slug);
CREATE INDEX idx_page_builder_elements_page_id ON public.page_builder_elements(page_id);
CREATE INDEX idx_page_builder_elements_parent_id ON public.page_builder_elements(parent_id);
CREATE INDEX idx_page_builder_templates_category ON public.page_builder_templates(category);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_page_builder_pages_updated_at
  BEFORE UPDATE ON public.page_builder_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_builder_elements_updated_at
  BEFORE UPDATE ON public.page_builder_elements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_builder_templates_updated_at
  BEFORE UPDATE ON public.page_builder_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default templates
INSERT INTO public.page_builder_templates (name, description, category, template_data, is_public) VALUES
('Lege Pagina', 'Begin met een lege pagina', 'basic', '{"elements": []}', true),
('Hero Sectie', 'Pagina met grote hero sectie', 'landing', '{"elements": [{"type": "container", "position": {"x": 0, "y": 0}, "size": {"width": 1200, "height": 600}, "style": {"backgroundColor": "#1e40af", "backgroundImage": "linear-gradient(135deg, #1e40af, #3b82f6)"}, "children": [{"type": "heading", "position": {"x": 50, "y": 200}, "size": {"width": 600, "height": 80}, "style": {"color": "#ffffff", "fontSize": 48, "fontWeight": "bold", "textAlign": "center"}, "content": "Welkom op onze Website"}, {"type": "text", "position": {"x": 50, "y": 300}, "size": {"width": 600, "height": 60}, "style": {"color": "#ffffff", "fontSize": 18, "textAlign": "center"}, "content": "Ontdek wat wij voor jou kunnen betekenen"}, {"type": "button", "position": {"x": 275, "y": 400}, "size": {"width": 150, "height": 50}, "style": {"backgroundColor": "#ffffff", "color": "#1e40af", "borderRadius": 8, "fontSize": 16}, "content": "Meer Informatie"}]}]}', true),
('Contact Pagina', 'Eenvoudige contact pagina layout', 'contact', '{"elements": [{"type": "heading", "position": {"x": 50, "y": 50}, "size": {"width": 400, "height": 60}, "style": {"fontSize": 32, "fontWeight": "bold"}, "content": "Contact"}, {"type": "form", "position": {"x": 50, "y": 150}, "size": {"width": 400, "height": 300}, "settings": {"fields": [{"name": "naam", "type": "text", "required": true}, {"name": "email", "type": "email", "required": true}, {"name": "bericht", "type": "textarea", "required": true}]}}]}', true);