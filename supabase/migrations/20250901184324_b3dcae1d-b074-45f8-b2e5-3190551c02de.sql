-- Create table for about section settings
CREATE TABLE public.about_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_title TEXT NOT NULL DEFAULT 'Over Mij',
  intro_text TEXT NOT NULL DEFAULT 'Hallo! Ik ben een gepassioneerde creatieve professional die graag verhalen vertelt door middel van visuele kunst, fotografie en digitaal ontwerp. Met meer dan 5 jaar ervaring help ik klanten hun visie tot leven te brengen.',
  description_text TEXT NOT NULL DEFAULT 'Mijn werk wordt gedreven door nieuwsgierigheid en de wens om betekenisvolle verbindingen te maken tussen mensen en merken. Elke project is een nieuwe kans om iets unieks te creëren.',
  skills JSONB NOT NULL DEFAULT '["Fotografie", "Grafisch Ontwerp", "Web Development", "Digitale Kunst", "UI/UX Design"]',
  services JSONB NOT NULL DEFAULT '[
    {
      "icon": "Palette",
      "title": "Creatief Ontwerp", 
      "description": "Van concept tot uitvoering, ik creëer visuele identiteiten die impact maken."
    },
    {
      "icon": "Camera",
      "title": "Fotografie",
      "description": "Professionele fotografie voor portretten, evenementen en commerciële doeleinden."
    },
    {
      "icon": "Laptop", 
      "title": "Digitale Oplossingen",
      "description": "Websites en digitale ervaringen die gebruikers boeien en converteren."
    }
  ]',
  stats JSONB NOT NULL DEFAULT '[
    {
      "number": "50+",
      "label": "Projecten"
    },
    {
      "number": "25+", 
      "label": "Tevreden Klanten"
    },
    {
      "number": "5+",
      "label": "Jaar Ervaring"
    }
  ]',
  quote_text TEXT NOT NULL DEFAULT 'Creativiteit is niet wat je ziet, maar wat je anderen laat zien.',
  quote_author TEXT NOT NULL DEFAULT 'Edgar Degas',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.about_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view about settings" 
ON public.about_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage about settings" 
ON public.about_settings 
FOR ALL 
USING (is_authenticated_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_about_settings_updated_at
BEFORE UPDATE ON public.about_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.about_settings (main_title, intro_text, description_text) 
VALUES ('Over Mij', 
        'Hallo! Ik ben een gepassioneerde creatieve professional die graag verhalen vertelt door middel van visuele kunst, fotografie en digitaal ontwerp. Met meer dan 5 jaar ervaring help ik klanten hun visie tot leven te brengen.',
        'Mijn werk wordt gedreven door nieuwsgierigheid en de wens om betekenisvolle verbindingen te maken tussen mensen en merken. Elke project is een nieuwe kans om iets unieks te creëren.');