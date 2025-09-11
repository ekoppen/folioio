#!/bin/bash

# Debug script to check environment variables in deployed site

if [ $# -eq 0 ]; then
    echo "Usage: $0 <site-name>"
    echo "Example: $0 mysite"
    exit 1
fi

SITE_NAME=$1
DEPLOY_DIR="deployments/$SITE_NAME"

if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Deployment directory not found: $DEPLOY_DIR"
    exit 1
fi

echo "🔍 Debugging environment for site: $SITE_NAME"
echo "📁 Deployment directory: $DEPLOY_DIR"
echo

if [ -f "$DEPLOY_DIR/.env" ]; then
    echo "📋 Environment variables from .env file:"
    echo "----------------------------------------"
    cat "$DEPLOY_DIR/.env"
    echo
    echo "----------------------------------------"
else
    echo "❌ No .env file found in deployment directory"
fi

echo
echo "🐳 Docker container status:"
echo "---------------------------"
docker-compose -f "$DEPLOY_DIR/docker-compose.yml" ps

echo
echo "📊 Database container logs (last 20 lines):"
echo "-------------------------------------------"
docker-compose -f "$DEPLOY_DIR/docker-compose.yml" logs --tail=20 postgres

echo
echo "🔧 API container logs (last 20 lines):"
echo "--------------------------------------"
docker-compose -f "$DEPLOY_DIR/docker-compose.yml" logs --tail=20 api-server

echo
echo "🔍 Testing database connection:"
echo "------------------------------"
DB_CONTAINER=$(docker-compose -f "$DEPLOY_DIR/docker-compose.yml" ps -q postgres)
if [ ! -z "$DB_CONTAINER" ]; then
    echo "Database container ID: $DB_CONTAINER"
    docker exec $DB_CONTAINER psql -U portfolio -d portfolio_db -c "SELECT 'Database connection successful' as status;"
else
    echo "❌ Database container not running"
fi