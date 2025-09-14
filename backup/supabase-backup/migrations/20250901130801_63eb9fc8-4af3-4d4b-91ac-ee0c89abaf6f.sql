-- Update homepage elements with proper layout and size units
UPDATE page_builder_elements 
SET 
  size_width = 100,
  size_height = CASE 
    WHEN element_type = 'hero' THEN 100
    WHEN element_type = 'slideshow' THEN 60 
    WHEN element_type = 'portfolio-gallery' THEN 80
    WHEN element_type = 'about' THEN 80
    ELSE size_height
  END,
  position_x = 0,
  position_y = 0
WHERE page_id IN (SELECT id FROM page_builder_pages WHERE is_homepage = true)
  AND element_type IN ('hero', 'slideshow', 'portfolio-gallery', 'about');