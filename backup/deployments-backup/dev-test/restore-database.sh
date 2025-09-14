#!/bin/bash

# Database restore script for portfolio deployment
# This script restores a database backup

echo "🔄 Database Restore Script"
echo "=========================="

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    if [ -d "./backups" ]; then
        ls -la ./backups/database_backup_*.sql 2>/dev/null | tail -10
    else
        echo "   No backups found in ./backups/ directory"
    fi
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Get container name from .env or use default
CONTAINER_NAME=$(grep "CONTAINER_NAME=" .env 2>/dev/null | cut -d'=' -f2)
DB_CONTAINER="${CONTAINER_NAME:-portfolio}-db"

# Check if database container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$DB_CONTAINER"; then
    echo "❌ Database container '$DB_CONTAINER' is not running"
    echo "💡 Start the deployment first: docker compose up -d"
    exit 1
fi

echo "📁 Backup file: $BACKUP_FILE"
echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "🎯 Target database: $DB_CONTAINER"
echo ""

# Ask for confirmation
read -p "⚠️  This will overwrite the current database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled."
    exit 0
fi

echo "🔄 Restoring database..."

# Stop the API server to prevent connections during restore
echo "⏸️  Stopping API server..."
docker compose stop api-server

# Drop and recreate the database
echo "🗑️  Recreating database..."
docker exec "$DB_CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS portfolio_db;"
docker exec "$DB_CONTAINER" psql -U postgres -c "CREATE DATABASE portfolio_db ENCODING 'UTF8';"

# Restore the backup
echo "📥 Restoring data..."
if docker exec -i "$DB_CONTAINER" psql -U postgres -d portfolio_db < "$BACKUP_FILE"; then
    echo "✅ Database restore completed successfully"
    
    # Restart the API server
    echo "▶️  Starting API server..."
    docker compose start api-server
    
    # Wait a bit and check health
    sleep 3
    if docker compose ps api-server --format "table {{.Status}}" | grep -q "Up"; then
        echo "✅ API server restarted successfully"
        echo ""
        echo "🎉 Database restore completed!"
        echo "💡 Your settings and data have been restored"
    else
        echo "⚠️  API server may need manual restart: docker compose restart api-server"
    fi
else
    echo "❌ Failed to restore database"
    
    # Try to restart API server anyway
    echo "🔄 Attempting to restart API server..."
    docker compose restart api-server
    exit 1
fi