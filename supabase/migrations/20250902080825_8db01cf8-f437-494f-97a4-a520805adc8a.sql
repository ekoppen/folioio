-- Add service and stats translations with correct key format
INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'service.creatief_ontwerp', 'en', 'Creative Design'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'service.creatief_ontwerp' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'service.creatief_ontwerp_desc', 'en', 'From concept to execution, I create visual identities that make an impact.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'service.creatief_ontwerp_desc' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'service.fotografie', 'en', 'Photography'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'service.fotografie' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'service.fotografie_desc', 'en', 'Professional photography for portraits, events and commercial purposes.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'service.fotografie_desc' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'service.digitale_oplossingen', 'en', 'Digital Solutions'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'service.digitale_oplossingen' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'service.digitale_oplossingen_desc', 'en', 'Websites and digital experiences that engage and convert users.'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'service.digitale_oplossingen_desc' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'stats.projecten', 'en', 'Projects'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'stats.projecten' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'stats.tevreden_klanten', 'en', 'Satisfied Clients'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'stats.tevreden_klanten' AND language_code = 'en');

INSERT INTO translations (translation_key, language_code, translation_value) 
SELECT 'stats.jaar_ervaring', 'en', 'Years Experience'
WHERE NOT EXISTS (SELECT 1 FROM translations WHERE translation_key = 'stats.jaar_ervaring' AND language_code = 'en');