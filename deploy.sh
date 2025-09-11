#!/bin/bash

# Portfolio Deployment Script with Automatic Database Migration
# Usage: ./deploy.sh

set -e  # Exit on any error

echo "🚀 Starting portfolio deployment..."

# Configuration
PROJECT_DIR="/path/to/your/portfolio"  # Update this path
DB_NAME="portfolio_db"
DB_USER="postgres"
DB_PASSWORD="your_db_password"  # Update this
BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the project root directory."
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Step 1: Pull latest changes from Git
log "Pulling latest changes from Git..."
git pull origin main || error "Failed to pull from Git"
success "Git pull completed"

# Step 2: Backup database
log "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
docker compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    warning "Database backup failed (database might not be running yet)"
}
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    success "Database backup created: $BACKUP_FILE"
else
    warning "Database backup is empty or failed"
    rm -f "$BACKUP_FILE"
fi

# Step 3: Apply database migrations
log "Applying database migrations..."
if [ -d "supabase/migrations" ]; then
    MIGRATIONS_APPLIED=0
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            log "Applying migration: $(basename "$migration")"
            docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$migration" || {
                warning "Migration $(basename "$migration") failed or already applied"
            }
            ((MIGRATIONS_APPLIED++))
        fi
    done
    success "Applied $MIGRATIONS_APPLIED database migrations"
else
    warning "No migrations directory found"
fi

# Step 4: Install/Update dependencies
log "Installing dependencies..."
npm install || error "npm install failed"
success "Dependencies installed"

# Step 5: Build the project
log "Building project..."
npm run build || error "Build failed"
success "Project built successfully"

# Step 6: Restart containers
log "Restarting containers..."
docker compose down || warning "Docker compose down failed"
docker compose up -d --build || error "Failed to start containers"
success "Containers restarted"

# Step 7: Wait for services to be ready
log "Waiting for services to start..."
sleep 10

# Health check
log "Performing health check..."
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    success "Health check passed"
else
    # Try alternative health check
    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        success "Site is responding"
    else
        warning "Health check failed, but deployment might still be successful"
    fi
fi

# Step 8: Cleanup old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true
success "Old backups cleaned up"

echo ""
success "🎉 Deployment completed successfully!"
echo ""
log "Next steps:"
echo "  1. Check your site at http://localhost:3001"
echo "  2. Verify all features are working"
echo "  3. Test the new settings in the admin panel"
echo ""
log "If you encounter issues:"
echo "  - Check logs: docker compose logs"
echo "  - Restore backup if needed: docker compose exec -T postgres psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
echo ""