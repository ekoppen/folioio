#!/bin/bash

echo "=== Debug Hero/Tagline Update Issue ==="
echo ""

# Find containers
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db|postgres" | grep -E "wouterkoppen" | head -1)
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-api" | head -1)

if [ -z "$DB_CONTAINER" ] || [ -z "$API_CONTAINER" ]; then
    echo "ERROR: Could not find wouterkoppen containers"
    exit 1
fi

echo "Found containers:"
echo "  DB: $DB_CONTAINER"
echo "  API: $API_CONTAINER"
echo ""

echo "1. Current site_title and site_tagline values:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT site_title, site_tagline FROM site_settings;" 2>/dev/null
echo ""

echo "2. Testing direct database update:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "UPDATE site_settings SET site_title = 'Test Title', site_tagline = 'Test Tagline';" 2>/dev/null
echo ""

echo "3. Verifying update worked:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT site_title, site_tagline FROM site_settings;" 2>/dev/null
echo ""

echo "4. Checking for any triggers that might block updates:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "\d site_settings" 2>/dev/null | grep -A 5 "Triggers"
echo ""

echo "5. Checking recent API errors related to site_title/tagline:"
docker logs $API_CONTAINER --tail 100 2>&1 | grep -E "site_title|site_tagline|UPDATE.*site_settings" | tail -20
echo ""

echo "6. Testing API endpoint directly:"
echo "Getting current settings..."
curl -s http://localhost:8080/api/site-settings | jq '.site_title, .site_tagline' 2>/dev/null || echo "Could not fetch from API"
echo ""

echo "7. Checking if columns have proper permissions:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name IN ('site_title', 'site_tagline');" 2>/dev/null
echo ""

echo "8. Resetting to original values (if you had Wouter Koppen as title):"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "UPDATE site_settings SET site_title = 'Wouter Koppen', site_tagline = '';" 2>/dev/null
echo ""

echo "=== Debug complete ==="
echo "If the direct database update worked (step 2-3), then the issue is in the API layer."
echo "If it didn't work, there might be a database constraint or trigger issue."