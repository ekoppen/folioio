#!/bin/bash

# Update script for all portfolio deployments
# This script pulls the latest code and updates all existing deployments

echo "🔄 Portfolio Deployment Update Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "deploy-simple.sh" ]; then
    echo "❌ Error: This script must be run from the main project directory containing deploy-simple.sh"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from repository..."
git fetch origin
CURRENT_BRANCH=$(git branch --show-current)
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "🔄 New changes available, updating..."
    git pull origin $CURRENT_BRANCH
    echo "✅ Code updated successfully"
else
    echo "ℹ️  Already up to date"
fi

# Check if deployments directory exists
if [ ! -d "deployments" ]; then
    echo "ℹ️  No deployments directory found. Nothing to update."
    exit 0
fi

# Find all deployments
DEPLOYMENTS=($(find deployments -mindepth 1 -maxdepth 1 -type d -exec basename {} \;))

if [ ${#DEPLOYMENTS[@]} -eq 0 ]; then
    echo "ℹ️  No deployments found in deployments directory."
    exit 0
fi

echo ""
echo "🎯 Found ${#DEPLOYMENTS[@]} deployment(s): ${DEPLOYMENTS[*]}"
echo ""

# Ask for confirmation
read -p "Do you want to update all deployments? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Update cancelled."
    exit 0
fi

# Function to update a single deployment
update_deployment() {
    local deployment=$1
    local deploy_dir="deployments/$deployment"
    
    echo "🔄 Updating deployment: $deployment"
    echo "  📍 Location: $deploy_dir"
    
    if [ ! -d "$deploy_dir" ]; then
        echo "  ❌ Deployment directory not found, skipping"
        return 1
    fi
    
    # Check if it's running and create database backup
    cd "$deploy_dir"
    if docker compose ps --quiet > /dev/null 2>&1; then
        IS_RUNNING=$(docker compose ps --services --filter "status=running" | wc -l)
        if [ $IS_RUNNING -gt 0 ]; then
            echo "  💾 Creating database backup before update..."
            mkdir -p backups
            BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
            
            # Create database backup
            if docker compose exec -T postgres pg_dump -U postgres portfolio_db > "$BACKUP_FILE" 2>/dev/null; then
                echo "  ✅ Database backup created: $BACKUP_FILE"
            else
                echo "  ⚠️  Database backup failed, but continuing..."
            fi
            
            echo "  ⏸️  Stopping containers (preserving volumes)..."
            docker compose down --remove-orphans
        fi
    fi
    
    # Backup .env file (contains passwords)
    if [ -f ".env" ]; then
        echo "  💾 Backing up environment file..."
        cp .env .env.backup
    fi
    
    # Ensure critical data directories exist and have correct permissions
    echo "  📁 Ensuring data directories are preserved..."
    mkdir -p data/postgres data/minio
    
    # Check if postgres data exists
    if [ -d "data/postgres" ] && [ "$(ls -A data/postgres 2>/dev/null)" ]; then
        echo "  ✅ PostgreSQL data directory exists and contains data"
    else
        echo "  ⚠️  PostgreSQL data directory is empty - database will be recreated"
    fi
    
    # Go back to main directory
    cd ../..
    
    # Copy updated files
    echo "  📦 Copying updated files..."
    
    # Copy core application files
    cp -r src public index.html package*.json vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js "$deploy_dir/" 2>/dev/null
    cp -r local-backend "$deploy_dir/"
    cp docker-compose.simple.yml "$deploy_dir/docker-compose.yml"
    cp nginx-simple.conf "$deploy_dir/"
    
    # Skip postgres-config migrations - using application-level migration system
    # The local-backend has its own migrator.js that handles migrations properly
    echo "  📦 Migrations handled by application migration system (migrator.js)"
    echo "  ✅ Database migrations will be applied automatically on container start"
    
    # Clean up any existing postgres-config migrations to prevent conflicts
    if [ -d "$deploy_dir/postgres-config" ]; then
        # Remove any .sql files that might cause conflicts
        OLD_MIGRATIONS=$(find "$deploy_dir/postgres-config" -name "*.sql" -type f | wc -l)
        if [ $OLD_MIGRATIONS -gt 0 ]; then
            echo "  🧹 Removing $OLD_MIGRATIONS old postgres-config migration(s) to prevent conflicts"
            rm -f "$deploy_dir/postgres-config"/*.sql
        fi
    fi
    
    # Ensure postgres-config directory exists but keep it empty for safety
    mkdir -p "$deploy_dir/postgres-config"
    
    # Add migration system info file
    cat > "$deploy_dir/postgres-config/.migration_system_note" << 'EOF'
-- Migration System Info
-- This deployment uses application-level migrations via migrator.js
-- Do not add migration files here to prevent data loss and conflicts
-- All migrations are handled by the Node.js backend on startup
EOF
    echo "  ℹ️  Using application-level migration system only"
    
    # Go to deployment directory
    cd "$deploy_dir"
    
    # Create data directories if they don't exist
    echo "  📁 Ensuring data directories exist..."
    mkdir -p data/postgres data/minio
    
    # Restore .env file
    if [ -f ".env.backup" ]; then
        echo "  🔧 Restoring environment configuration..."
        mv .env.backup .env
    fi
    
    # Rebuild and restart
    echo "  🔨 Rebuilding frontend..."
    if npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1; then
        echo "  ✅ Frontend build successful"
    else
        echo "  ⚠️  Frontend build had warnings (check logs if needed)"
    fi
    
    echo "  🐳 Starting containers..."
    if docker compose up -d --build > /dev/null 2>&1; then
        echo "  ✅ Containers started successfully"
        
        # Wait a bit and check health
        sleep 5
        RUNNING_SERVICES=$(docker compose ps --services --filter "status=running" | wc -l)
        TOTAL_SERVICES=$(docker compose ps --services | wc -l)
        
        if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
            echo "  ✅ All services healthy ($RUNNING_SERVICES/$TOTAL_SERVICES running)"
            
            # Check database integrity after update
            echo "  🔍 Verifying database integrity..."
            sleep 3  # Give database time to fully start
            
            # Check if data was preserved (not reset to defaults)
            DB_CHECK=$(docker compose exec -T postgres psql -U postgres portfolio_db -t -c "SELECT COUNT(*) FROM site_settings;" 2>/dev/null | tr -d '[:space:]' 2>/dev/null)
            if [ "$DB_CHECK" -gt 0 ]; then
                echo "  ✅ Database contains user settings"
                
                # Quick check if settings look like defaults (potential data loss)
                DEFAULT_CHECK=$(docker compose exec -T postgres psql -U postgres portfolio_db -t -c "SELECT CASE WHEN site_title = 'Portfolio' AND contact_email = 'contact@example.com' THEN 'defaults' ELSE 'custom' END FROM site_settings LIMIT 1;" 2>/dev/null | tr -d '[:space:]' 2>/dev/null)
                if [ "$DEFAULT_CHECK" = "defaults" ]; then
                    echo "  ⚠️  WARNING: Settings appear to be reset to defaults!"
                    echo "      Your custom settings may have been lost."
                    echo "      Check backup: $BACKUP_FILE"
                else
                    echo "  ✅ Custom settings preserved"
                fi
            else
                echo "  ⚠️  Database appears empty - this may be a new installation"
            fi
        else
            echo "  ⚠️  Some services may not be running ($RUNNING_SERVICES/$TOTAL_SERVICES)"
            echo "      Check logs: cd $deploy_dir && docker compose logs"
        fi
    else
        echo "  ❌ Failed to start containers"
        return 1
    fi
    
    # Get port info from .env
    FRONTEND_PORT=$(grep "FRONTEND_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    MINIO_CONSOLE_PORT=$(grep "MINIO_CONSOLE_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    
    echo "  🌐 Site: http://localhost:${FRONTEND_PORT:-unknown}"
    if [ -n "$MINIO_CONSOLE_PORT" ]; then
        echo "  🗄️  MinIO: http://localhost:$MINIO_CONSOLE_PORT"
    fi
    
    cd ../..
    echo "  ✅ Update completed for $deployment"
    echo ""
}

# Update all deployments
FAILED_UPDATES=()
SUCCESSFUL_UPDATES=()

for deployment in "${DEPLOYMENTS[@]}"; do
    if update_deployment "$deployment"; then
        SUCCESSFUL_UPDATES+=("$deployment")
    else
        FAILED_UPDATES+=("$deployment")
    fi
done

# Summary
echo "================================================="
echo "📊 Update Summary"
echo "================================================="
echo "✅ Successful updates: ${#SUCCESSFUL_UPDATES[@]}"
for success in "${SUCCESSFUL_UPDATES[@]}"; do
    echo "   - $success"
done

if [ ${#FAILED_UPDATES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Failed updates: ${#FAILED_UPDATES[@]}"
    for failed in "${FAILED_UPDATES[@]}"; do
        echo "   - $failed"
    done
    echo ""
    echo "💡 For failed updates, try:"
    echo "   1. Check logs: cd deployments/<name> && docker compose logs"
    echo "   2. Manual restart: cd deployments/<name> && docker compose up -d --build"
    echo "   3. Check port conflicts with: ./check-ports.sh"
fi

echo ""
echo "🎉 Update process completed!"
echo ""
echo "💡 Next steps:"
echo "   - Check all sites are working correctly"
echo "   - Clear browser cache if needed"
echo "   - Update your nginx proxy manager if using custom configurations"
echo ""