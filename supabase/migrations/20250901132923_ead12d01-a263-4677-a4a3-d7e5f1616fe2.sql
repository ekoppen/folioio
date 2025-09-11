-- Update existing homepage elements with proper settings
UPDATE page_builder_elements 
SET styles = jsonb_build_object(
  'backgroundColor', 'transparent',
  'position_x_unit', 'px',
  'position_y_unit', 'px',
  'size_width_unit', '%',
  'size_height_unit', 'vh',
  'layout', jsonb_build_object('positioning', 'relative'),
  'settings', jsonb_build_object(
    'siteTitle', 'Welkom',
    'siteTagline', 'Ontdek onze prachtige fotografie',
    'showButtons', true
  )
)
WHERE element_type = 'hero' AND page_id = '310176dd-88ac-46ea-bc0d-9478844525fb';

UPDATE page_builder_elements 
SET styles = jsonb_build_object(
  'backgroundColor', 'transparent',
  'position_x_unit', 'px',
  'position_y_unit', 'px',
  'size_width_unit', '%',
  'size_height_unit', 'vh',
  'layout', jsonb_build_object('positioning', 'relative'),
  'settings', jsonb_build_object(
    'slideshowAlbum', 'normandie',
    'autoAdvance', true,
    'transitionDuration', 6000,
    'transitionEffect', 'fade',
    'showNavigation', true,
    'showIndicators', true,
    'overlay', true,
    'overlayOpacity', 40
  )
)
WHERE element_type = 'slideshow' AND page_id = '310176dd-88ac-46ea-bc0d-9478844525fb';

UPDATE page_builder_elements 
SET styles = jsonb_build_object(
  'backgroundColor', 'transparent',
  'position_x_unit', 'px',
  'position_y_unit', 'px',
  'size_width_unit', '%',
  'size_height_unit', 'vh',
  'layout', jsonb_build_object('positioning', 'relative'),
  'settings', jsonb_build_object(
    'showAllCategories', true,
    'gridColumns', 3
  )
)
WHERE element_type = 'portfolio-gallery' AND page_id = '310176dd-88ac-46ea-bc0d-9478844525fb';

UPDATE page_builder_elements 
SET styles = jsonb_build_object(
  'backgroundColor', 'transparent',
  'position_x_unit', 'px',
  'position_y_unit', 'px',
  'size_width_unit', '%',
  'size_height_unit', 'vh',
  'layout', jsonb_build_object('positioning', 'relative')
)
WHERE element_type = 'about' AND page_id = '310176dd-88ac-46ea-bc0d-9478844525fb';