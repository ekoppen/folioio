#!/bin/bash

echo "=== Debug API Database Error ==="
echo ""

# Find containers
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-api" | head -1)
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-db" | head -1)

if [ -z "$API_CONTAINER" ]; then
    echo "ERROR: Could not find wouterkoppen-api container"
    exit 1
fi

echo "Found API container: $API_CONTAINER"
echo ""

echo "1. Clearing old logs and monitoring new ones..."
echo "   (Keep this script running while you try to save in the admin panel)"
echo ""
echo "2. Following API logs (press Ctrl+C after testing):"
echo "========================================="

# Follow the logs to capture the exact error when it happens
docker logs -f $API_CONTAINER 2>&1 | grep -E "Database operation error|SQL that failed|Parameters|Full error details|POST /api/database" -A 10

echo ""
echo "========================================="
echo ""
echo "3. Alternative: Last 200 lines of API logs with all errors:"
docker logs $API_CONTAINER --tail 200 2>&1 | grep -E "error|Error|ERROR|500|Database operation" -B 2 -A 5

echo ""
echo "4. Checking if all required columns exist:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND column_name IN (
  'site_title', 'site_tagline',
  'nav_title_visible', 'nav_title_color', 'nav_title_font_family',
  'nav_title_font_url', 'nav_title_font_size', 'nav_title_margin_top',
  'nav_title_margin_left', 'nav_tagline_visible', 'nav_tagline_color',
  'nav_tagline_font_family', 'nav_tagline_font_url', 'nav_tagline_font_size',
  'nav_tagline_margin_top', 'nav_tagline_margin_left', 'nav_text_shadow',
  'show_logo', 'nav_logo_visible'
)
ORDER BY column_name;" 2>/dev/null

echo ""
echo "5. Testing direct API call with curl:"
echo "First, getting current settings..."
CURRENT_SETTINGS=$(docker exec $API_CONTAINER curl -s http://localhost:3000/api/site-settings 2>/dev/null | head -c 500)
echo "$CURRENT_SETTINGS"

echo ""
echo "=== Instructions ==="
echo "1. Run this script: ./debug-api-error.sh"
echo "2. In another terminal or browser, try to save settings in the admin panel"
echo "3. Watch the logs output above for the exact error"
echo "4. Press Ctrl+C to stop following logs"
echo "5. Share the error output that appears"