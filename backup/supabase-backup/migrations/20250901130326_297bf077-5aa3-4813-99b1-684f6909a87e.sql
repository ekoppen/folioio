-- Create default homepage with elements for existing content
DO $$
DECLARE
    homepage_id UUID;
    hero_id TEXT := gen_random_uuid()::text;
    slideshow_id TEXT := gen_random_uuid()::text;
    portfolio_id TEXT := gen_random_uuid()::text;
    about_id TEXT := gen_random_uuid()::text;
BEGIN
    -- Only create homepage if it doesn't exist
    SELECT id INTO homepage_id FROM page_builder_pages WHERE is_homepage = true LIMIT 1;
    
    IF homepage_id IS NULL THEN
        -- Create homepage
        INSERT INTO page_builder_pages (id, name, slug, is_homepage, is_published)
        VALUES (gen_random_uuid(), 'Homepage', 'home', true, true)
        RETURNING id INTO homepage_id;
        
        -- Create Hero element
        INSERT INTO page_builder_elements (
            page_id, element_id, element_type, position_x, position_y, 
            size_width, size_height, sort_order, content, styles
        ) VALUES (
            homepage_id, hero_id, 'hero', 0, 0, 
            100, 100, 1, '', '{}'::jsonb
        );
        
        -- Create Slideshow element
        INSERT INTO page_builder_elements (
            page_id, element_id, element_type, position_x, position_y, 
            size_width, size_height, sort_order, content, styles
        ) VALUES (
            homepage_id, slideshow_id, 'slideshow', 0, 100, 
            100, 60, 2, '', '{}'::jsonb
        );
        
        -- Create Portfolio Gallery element
        INSERT INTO page_builder_elements (
            page_id, element_id, element_type, position_x, position_y, 
            size_width, size_height, sort_order, content, styles
        ) VALUES (
            homepage_id, portfolio_id, 'portfolio-gallery', 0, 160, 
            100, 80, 3, '', '{}'::jsonb
        );
        
        -- Create About element
        INSERT INTO page_builder_elements (
            page_id, element_id, element_type, position_x, position_y, 
            size_width, size_height, sort_order, content, styles
        ) VALUES (
            homepage_id, about_id, 'about', 0, 240, 
            100, 80, 4, '', '{}'::jsonb
        );
    END IF;
END $$;