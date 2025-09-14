-- Add missing UI translations for English (safe insert method)
INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'about_settings.main_title', 'en', 'About Me'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'about_settings.main_title' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'about_settings.intro_text', 'en', 'Hello! I am a passionate creative professional who loves telling stories through visual arts, photography and digital design. With over 5 years of experience, I help clients bring their vision to life.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'about_settings.intro_text' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'about_settings.description_text', 'en', 'My work is driven by curiosity and the desire to create meaningful connections between people and brands. Every project is a new opportunity to create something unique.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'about_settings.description_text' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'about_settings.quote_text', 'en', 'Creativity is not what you see, but what you make others see.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'about_settings.quote_text' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'about_settings.quote_author', 'en', 'Edgar Degas'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'about_settings.quote_author' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'about.contact_subtitle', 'en', 'Ready to work together on your next project?'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'about.contact_subtitle' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'site_settings.site_title', 'en', 'PhotoArt'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'site_settings.site_title' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'site_settings.site_tagline', 'en', 'My gaze, your gaze'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'site_settings.site_tagline' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'site_settings.portfolio_title', 'en', 'My Portfolio'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'site_settings.portfolio_title' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'site_settings.portfolio_description', 'en', 'Discover various projects and albums that reflect my creative journey.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'site_settings.portfolio_description' AND language_code = 'en');