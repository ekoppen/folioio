#!/bin/bash

echo "=== Fix Hero Title/Tagline Settings ==="
echo ""

# Find containers
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-db" | head -1)
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-api" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: No database container found"
    exit 1
fi

echo "Found containers:"
echo "  DB: $DB_CONTAINER"
echo "  API: $API_CONTAINER"
echo ""

echo "1. Checking current values for hero title/tagline settings:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT 
  site_title, 
  site_tagline,
  home_show_title_overlay,
  title_visible,
  tagline_visible
FROM site_settings
LIMIT 1;" 2>/dev/null

echo ""
echo "2. Testing if we can update the visibility settings:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
UPDATE site_settings 
SET 
  title_visible = false,
  tagline_visible = false,
  home_show_title_overlay = false
WHERE id IS NOT NULL;" 2>/dev/null

echo ""
echo "3. Verifying the update worked:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT 
  title_visible,
  tagline_visible,
  home_show_title_overlay
FROM site_settings
LIMIT 1;" 2>/dev/null

echo ""
echo "4. Checking all columns that might be related to hero/home settings:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND (
  column_name LIKE '%home%' OR 
  column_name LIKE '%hero%' OR 
  column_name LIKE '%title%' OR 
  column_name LIKE '%tagline%' OR
  column_name LIKE '%overlay%'
)
ORDER BY column_name;" 2>/dev/null

echo ""
echo "5. Restarting API to ensure changes are picked up:"
if [ ! -z "$API_CONTAINER" ]; then
    docker restart $API_CONTAINER
    echo "API container restarted"
else
    echo "No API container found to restart"
fi

echo ""
echo "=== Fix complete ==="
echo "The hero title and tagline should now be hidden."
echo "If you still see them, there might be a caching issue in the frontend."