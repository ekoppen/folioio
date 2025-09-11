#!/bin/bash

echo "=== Fix Missing tagline_font_family Column ==="
echo ""

# Find the database container
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

echo "Adding missing tagline_font_family column..."
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tagline_font_family text;
"

echo ""
echo "Verifying the column was added:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND column_name = 'tagline_font_family';"

echo ""
echo "Restarting API container..."
if [ ! -z "$API_CONTAINER" ]; then
    docker restart $API_CONTAINER
    echo "API container restarted"
    
    echo ""
    echo "Waiting for API to be ready..."
    sleep 10
    
    echo "Testing API health..."
    docker exec $API_CONTAINER wget -q -O- http://localhost:3000/health 2>/dev/null || echo "API not responding yet"
else
    echo "No API container found to restart"
fi

echo ""
echo "=== Fix complete ==="
echo "The tagline_font_family column has been added."
echo "The 500 error should now be resolved."