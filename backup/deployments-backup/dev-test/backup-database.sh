#!/bin/bash

# Database backup script for portfolio deployment
# This script creates a backup of the current database before updates

echo "💾 Database Backup Script"
echo "========================="

# Get container name from .env or use default
CONTAINER_NAME=$(grep "CONTAINER_NAME=" .env 2>/dev/null | cut -d'=' -f2)
DB_CONTAINER="${CONTAINER_NAME:-portfolio}-db"

# Check if database container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$DB_CONTAINER"; then
    echo "❌ Database container '$DB_CONTAINER' is not running"
    echo "💡 Start the deployment first: docker compose up -d"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"

echo "🔄 Creating database backup..."
echo "📁 Backup location: $BACKUP_FILE"

# Create database backup
if docker exec "$DB_CONTAINER" pg_dump -U postgres portfolio_db > "$BACKUP_FILE"; then
    echo "✅ Database backup created successfully"
    echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Keep only last 10 backups
    echo "🧹 Cleaning old backups (keeping last 10)..."
    cd "$BACKUP_DIR"
    ls -t database_backup_*.sql | tail -n +11 | xargs -r rm
    BACKUP_COUNT=$(ls -1 database_backup_*.sql 2>/dev/null | wc -l)
    echo "📦 Total backups retained: $BACKUP_COUNT"
    cd ..
    
    echo ""
    echo "✅ Backup completed successfully!"
    echo "💡 To restore this backup later:"
    echo "   ./restore-database.sh $BACKUP_FILE"
else
    echo "❌ Failed to create database backup"
    exit 1
fi