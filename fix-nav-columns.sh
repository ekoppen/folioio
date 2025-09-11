#!/bin/bash

echo "=== Quick Fix for Navigation Columns ==="
echo ""

# Find the database container
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db|postgres" | grep -E "wouterkoppen" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: No wouterkoppen database container found"
    exit 1
fi

echo "Found database container: $DB_CONTAINER"
echo ""

echo "Adding all missing navigation columns..."

# Add all navigation columns
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
-- Navigation title settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_visible boolean DEFAULT true;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_color text DEFAULT '#ffffff';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_font_family text DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_font_url text DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_font_size integer DEFAULT 24;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_margin_top integer DEFAULT 0;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_title_margin_left integer DEFAULT 0;

-- Navigation tagline settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_visible boolean DEFAULT true;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_color text DEFAULT '#e0e0e0';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_font_family text DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_font_url text DEFAULT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_font_size integer DEFAULT 14;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_margin_top integer DEFAULT 4;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_tagline_margin_left integer DEFAULT 0;

-- Text shadow
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_text_shadow boolean DEFAULT false;
"

echo ""
echo "Verifying columns were added:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name LIKE 'nav_%' ORDER BY column_name;"

echo ""
echo "Restarting API container..."
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-api" | head -1)
docker restart $API_CONTAINER

echo ""
echo "=== Fix complete ==="
echo "Try saving the settings again in the admin panel."