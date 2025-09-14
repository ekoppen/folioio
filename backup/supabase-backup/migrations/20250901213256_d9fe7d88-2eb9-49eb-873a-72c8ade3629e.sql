-- Add missing UI translations for English
INSERT INTO translations (translation_key, language_code, translation_value) VALUES
-- About section translations
('about_settings.main_title', 'en', 'About Me'),
('about_settings.intro_text', 'en', 'Hello! I am a passionate creative professional who loves telling stories through visual arts, photography and digital design. With over 5 years of experience, I help clients bring their vision to life.'),
('about_settings.description_text', 'en', 'My work is driven by curiosity and the desire to create meaningful connections between people and brands. Every project is a new opportunity to create something unique.'),
('about_settings.quote_text', 'en', 'Creativity is not what you see, but what you make others see.'),
('about_settings.quote_author', 'en', 'Edgar Degas'),
('about.contact_subtitle', 'en', 'Ready to work together on your next project?'),
-- Site settings translations
('site_settings.site_title', 'en', 'PhotoArt'),
('site_settings.site_tagline', 'en', 'My gaze, your gaze'),
('site_settings.portfolio_title', 'en', 'My Portfolio'),
('site_settings.portfolio_description', 'en', 'Discover various projects and albums that reflect my creative journey.'),
-- Portfolio translations
('portfolio.loading', 'en', 'Loading portfolio...'),
('portfolio.default_description', 'en', 'View the photos in this album'),
('portfolio.no_albums', 'en', 'No visible albums with photos found yet.'),
('portfolio.no_albums_category', 'en', 'No albums found in the category "{category}".'),
-- Service translations (common services)
('service.creative_design', 'en', 'Creative Design'),
('service.creative_design_desc', 'en', 'From concept to execution, I create visual identities that make an impact.'),
('service.photography', 'en', 'Photography'), 
('service.photography_desc', 'en', 'Professional photography for portraits, events and commercial purposes.'),
('service.digital_solutions', 'en', 'Digital Solutions'),
('service.digital_solutions_desc', 'en', 'Websites and digital experiences that engage and convert users.'),
-- Stats translations  
('stats.projects', 'en', 'Projects'),
('stats.satisfied_clients', 'en', 'Satisfied Clients'),
('stats.years_experience', 'en', 'Years Experience')
ON CONFLICT (translation_key, language_code) DO UPDATE SET translation_value = EXCLUDED.translation_value;