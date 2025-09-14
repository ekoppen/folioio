-- Add columns for hierarchical navigation and homepage functionality
ALTER TABLE page_builder_pages 
ADD COLUMN parent_page_id uuid,
ADD COLUMN is_homepage boolean DEFAULT false,
ADD COLUMN menu_order integer DEFAULT 0;

-- Add foreign key constraint for parent-child relationships
ALTER TABLE page_builder_pages 
ADD CONSTRAINT page_builder_pages_parent_page_id_fkey 
FOREIGN KEY (parent_page_id) REFERENCES page_builder_pages(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_page_builder_pages_parent_page_id ON page_builder_pages(parent_page_id);
CREATE INDEX idx_page_builder_pages_menu_order ON page_builder_pages(menu_order);

-- Ensure only one homepage exists
CREATE UNIQUE INDEX idx_page_builder_pages_unique_homepage 
ON page_builder_pages(is_homepage) 
WHERE is_homepage = true;