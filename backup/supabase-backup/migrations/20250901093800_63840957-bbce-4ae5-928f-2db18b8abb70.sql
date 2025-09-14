-- Insert home page if it doesn't exist
INSERT INTO public.pages (title, slug, content, meta_description, is_published)
SELECT 'Home', 'home', 'Welkom op mijn portfolio website', 'Portfolio homepage - fotografie en creatieve werken', true
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'home');