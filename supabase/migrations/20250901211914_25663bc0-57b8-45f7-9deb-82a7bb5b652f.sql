-- Add essential UI translations for English
INSERT INTO translations (translation_key, language_code, translation_value) VALUES
('nav.home', 'en', 'Home'),
('nav.portfolio', 'en', 'Portfolio'),
('nav.about', 'en', 'About'),
('nav.contact', 'en', 'Contact'),
('hero.view_portfolio', 'en', 'View Portfolio'),
('hero.learn_more', 'en', 'Learn More About Me'),
('about.expertise', 'en', 'Expertise'),
('about.contact_button', 'en', 'Get In Touch'),
('portfolio.view_album', 'en', 'View Album'),
('portfolio.photos', 'en', 'photos'),
('contact.title', 'en', 'Get In Touch'),
('contact.name', 'en', 'Name'),
('contact.email', 'en', 'Email'),
('contact.phone', 'en', 'Phone'),
('contact.message', 'en', 'Message'),
('contact.send_message', 'en', 'Send Message')
ON CONFLICT (translation_key, language_code) DO UPDATE SET translation_value = EXCLUDED.translation_value;