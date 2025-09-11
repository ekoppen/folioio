#!/bin/bash

echo "=== Portfolio Server Debug Script ==="
echo ""

# Find the container names
echo "1. Checking running containers:"
docker ps | grep -E "api|db|postgres"
echo ""

# Get the API container name
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "api" | head -1)
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db|postgres" | head -1)

if [ -z "$API_CONTAINER" ]; then
    echo "ERROR: No API container found running"
    exit 1
fi

if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: No database container found running"
    exit 1
fi

echo "Found containers:"
echo "  API: $API_CONTAINER"
echo "  DB: $DB_CONTAINER"
echo ""

# Check migration status
echo "2. Checking migration status in database:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT * FROM schema_migrations ORDER BY version;" 2>/dev/null || echo "No migrations table found"
echo ""

# Check if the columns exist
echo "3. Checking if show_logo columns exist:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' AND (column_name = 'show_logo' OR column_name = 'nav_logo_visible');"
echo ""

# Check all columns that might be missing
echo "4. Checking all site_settings columns:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' ORDER BY column_name;" | head -60
echo ""

# Check API logs
echo "5. Recent API error logs:"
docker logs $API_CONTAINER --tail 50 2>&1 | grep -A 2 -B 2 "error\|Error\|ERROR\|500" || echo "No recent errors found"
echo ""

# Try to manually run the migration
echo "6. Attempting to run migration manually:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS show_logo boolean DEFAULT true;"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nav_logo_visible boolean DEFAULT true;"
echo ""

# Check if it worked
echo "7. Verifying columns were added:"
docker exec $DB_CONTAINER psql -U postgres -d portfolio_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'site_settings' AND (column_name = 'show_logo' OR column_name = 'nav_logo_visible');"
echo ""

echo "8. Restarting API container to pick up changes:"
docker restart $API_CONTAINER
sleep 5
echo ""

echo "9. Checking API health after restart:"
docker ps | grep $API_CONTAINER
echo ""

echo "=== Debug complete ==="
echo "Try saving the settings again in the admin panel."
echo "If it still fails, please share the output of this script."