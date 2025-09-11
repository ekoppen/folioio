-- Remove conflicting slideshow element from page builder homepage
DELETE FROM page_builder_elements 
WHERE page_id = '310176dd-88ac-46ea-bc0d-9478844525fb' 
AND element_type = 'slideshow';

-- Clean up old footer elements that are no longer needed
DELETE FROM footer_elements;

-- Unpublish the page builder homepage to use the original Index page
UPDATE page_builder_pages 
SET is_published = false 
WHERE is_homepage = true;