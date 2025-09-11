-- Remove old generic album translation keys that don't work properly
DELETE FROM translations WHERE translation_key IN ('albums.name', 'albums.description') AND language_code = 'en';

-- Add specific album translations for each album
INSERT INTO translations (translation_key, language_code, translation_value) VALUES
-- Album names
('albums.name.5df1731a-9221-469f-933b-b3b4c7b02989', 'en', 'Abstracts'),
('albums.name.9e98723e-3267-4e03-b35e-3cb1ebca2821', 'en', 'Commercial'),
('albums.name.5b774029-d53e-4269-ac26-43c20961b6ff', 'en', 'Markings'),
('albums.name.31e0c22d-bf96-43a6-9b54-fa90e2932fca', 'en', 'New England'),
('albums.name.5cda6f1d-8dea-42c5-a4b7-c3c9048db50c', 'en', 'New York'),
('albums.name.219b7a85-590b-4cd3-ae11-6b947e5f0259', 'en', 'Normandy'),
('albums.name.1ea0e69b-d993-4520-9999-59843641ac14', 'en', 'Urban'),

-- Album descriptions
('albums.description.219b7a85-590b-4cd3-ae11-6b947e5f0259', 'en', 'The coast of Normandy has been a source of inspiration for years. The ever-changing colors of the sea with its clear horizon. In several black and white shots, I have aligned a foreground element with that horizon. In other images, I showcase the unity between the sea and humanity by photographing a pier, a fish stall, or a children''s playground in the foreground.'),

-- Contact modal translations
('contact.title', 'en', 'Contact Me'),
('contact.subtitle', 'en', 'Have a question or want to collaborate? Send me a message!'),
('contact.name', 'en', 'Name'),
('contact.email', 'en', 'Email'),
('contact.phone', 'en', 'Phone'),
('contact.subject', 'en', 'Subject'),
('contact.message', 'en', 'Message'),
('contact.name_placeholder', 'en', 'Your name'),
('contact.email_placeholder', 'en', 'your@email.com'),
('contact.phone_placeholder', 'en', '06 12 34 56 78'),
('contact.subject_placeholder', 'en', 'Subject of your message'),
('contact.message_placeholder', 'en', 'Tell me about your project or question...'),
('contact.cancel', 'en', 'Cancel'),
('contact.send_message', 'en', 'Send Message'),
('contact.sending', 'en', 'Sending...'),
('contact.required_fields', 'en', 'Required fields'),
('contact.fill_required', 'en', 'Please fill in all required fields.'),
('contact.message_sent', 'en', 'Message sent!'),
('contact.thank_you', 'en', 'Thank you for your message. We will contact you as soon as possible.'),
('contact.error', 'en', 'Something went wrong'),
('contact.try_again', 'en', 'The message could not be sent. Please try again later.'),

-- About section translations
('about.expertise', 'en', 'Expertise'),
('about.contact_button', 'en', 'Get In Touch'),
('about.contact_subtitle', 'en', 'Ready to work together on your next project?'),

-- Skills translations
('skills.fotografie', 'en', 'Photography'),
('skills.grafisch_ontwerp', 'en', 'Graphic Design'),
('skills.web_development', 'en', 'Web Development'),
('skills.digitale_kunst', 'en', 'Digital Art'),
('skills.ui_ux_design', 'en', 'UI/UX Design'),

-- Stats translations
('stats.projecten', 'en', 'Projects'),
('stats.tevreden_klanten', 'en', 'Satisfied Clients'),
('stats.jaar_ervaring', 'en', 'Years Experience'),

-- Service translations
('service.creatief_ontwerp', 'en', 'Creative Design'),
('service.creatief_ontwerp_desc', 'en', 'From concept to execution, I create visual identities that make an impact.'),
('service.fotografie', 'en', 'Photography'),
('service.fotografie_desc', 'en', 'Professional photography for portraits, events and commercial purposes.'),
('service.digitale_oplossingen', 'en', 'Digital Solutions'),
('service.digitale_oplossingen_desc', 'en', 'Websites and digital experiences that engage users and convert.'),

-- Footer text translation
('site_settings.footer_text', 'en', '© 2025 Portfolio. All rights reserved.');

-- Insert conflict resolution
ON CONFLICT (translation_key, language_code) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = now();