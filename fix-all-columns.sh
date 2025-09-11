#!/bin/bash

echo "=== Comprehensive Column Fix Script ==="
echo ""

# Find the database container
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db|postgres" | grep -E "wouterkoppen" | head -1)
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-api" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: No wouterkoppen database container found"
    exit 1
fi

echo "Found containers:"
echo "  DB: $DB_CONTAINER"
echo "  API: $API_CONTAINER"
echo ""

echo "Adding ALL potentially missing columns to site_settings table..."
echo ""

# Add all columns that might be missing
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db << 'EOF'
-- Basic site settings (ensure they exist)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS site_title text DEFAULT 'Portfolio';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS site_tagline text DEFAULT '';

-- Logo settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS show_logo boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_logo_visible boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS logo_url text;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS logo_position text DEFAULT 'left';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS logo_height integer DEFAULT 32;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS logo_margin_top integer DEFAULT 0;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS logo_margin_left integer DEFAULT 0;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS logo_shadow boolean DEFAULT false;

-- Navigation title settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_visible boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_color text DEFAULT '#ffffff';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_font_family text;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_font_url text;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_font_size integer DEFAULT 24;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_margin_top integer DEFAULT 0;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_title_margin_left integer DEFAULT 0;

-- Navigation tagline settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_visible boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_color text DEFAULT '#e0e0e0';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_font_family text;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_font_url text;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_font_size integer DEFAULT 14;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_margin_top integer DEFAULT 4;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_tagline_margin_left integer DEFAULT 0;

-- Text shadow
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS nav_text_shadow boolean DEFAULT false;

-- Home/Hero settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS home_show_buttons boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS home_show_title_overlay boolean DEFAULT true;

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS show_site_title boolean DEFAULT true;

-- Ensure updated_at column exists
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW();

-- Ensure there's at least one row in site_settings
INSERT INTO site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- Show the result
SELECT 'Successfully added/verified columns' as status;
EOF

echo ""
echo "Verifying all columns now exist:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND (column_name LIKE 'nav_%' OR column_name LIKE '%logo%' OR column_name IN ('site_title', 'site_tagline', 'home_show_buttons', 'home_show_title_overlay', 'show_site_title'))
ORDER BY column_name;" 2>/dev/null

echo ""
echo "Total columns in site_settings table:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'site_settings';" 2>/dev/null

echo ""
echo "Restarting API container to pick up database changes..."
docker restart $API_CONTAINER

echo ""
echo "Waiting for API to be ready..."
sleep 10

echo ""
echo "Testing API health:"
docker exec $API_CONTAINER wget -q -O- http://localhost:3000/health 2>/dev/null || echo "API not responding yet, may need more time"

echo ""
echo "=== Fix complete ==="
echo "All columns should now be present. Try saving settings in the admin panel again."
echo "If it still fails, run ./debug-api-error.sh to capture the exact error."