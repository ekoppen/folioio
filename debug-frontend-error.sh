#!/bin/bash

echo "=== Debug Frontend 500 Error ==="
echo ""

# Find containers
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-api" | head -1)
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "wouterkoppen-db" | head -1)

if [ -z "$API_CONTAINER" ] || [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: Could not find wouterkoppen containers"
    exit 1
fi

echo "Found containers:"
echo "  API: $API_CONTAINER"
echo "  DB: $DB_CONTAINER"
echo ""

echo "1. Following API logs for frontend errors (open wouterkoppen.com in browser while this runs):"
echo "========================================="
echo "Press Ctrl+C after you see the error"
echo ""

# Follow logs and look for the exact SELECT statement that fails
docker logs -f $API_CONTAINER 2>&1 | grep -E "Database operation error|SQL that failed|column.*does not exist" -A 5 -B 2