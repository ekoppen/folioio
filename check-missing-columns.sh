#!/bin/bash

echo "=== Check Missing Columns Script ==="
echo ""

# Find the database container  
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db|postgres" | grep -E "wouterkoppen" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: No wouterkoppen database container found"
    echo "Trying local test container..."
    DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "test.*db" | head -1)
fi

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: No database container found"
    exit 1
fi

echo "Found database container: $DB_CONTAINER"
echo ""

echo "=== ALL site_settings columns ==="
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'site_settings' ORDER BY column_name;" 2>/dev/null

echo ""
echo "=== Checking specific column groups ==="
echo ""
echo "Home/Hero related columns:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' AND (column_name LIKE '%home%' OR column_name LIKE '%hero%' OR column_name = 'site_title' OR column_name = 'site_tagline');" 2>/dev/null

echo ""
echo "Nav related columns:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name LIKE 'nav_%';" 2>/dev/null

echo ""
echo "Logo related columns:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name LIKE '%logo%';" 2>/dev/null

echo ""
echo "=== Current site_title and site_tagline values ==="
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT site_title, site_tagline FROM site_settings LIMIT 1;" 2>/dev/null