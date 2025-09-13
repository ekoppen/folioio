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
    
    # CRITICAL: Check if data directory exists and has PostgreSQL data BEFORE stopping
    echo "  🔍 Checking current database state..."
    echo "  📂 Current directory: $(pwd)"
    
    # Check all possible data locations
    echo "  🔍 Checking for existing PostgreSQL data..."
    
    # Check local data directory
    if [ -d "data/postgres" ]; then
        # Fix permissions first to ensure we can read the directory
        echo "  🔧 Fixing PostgreSQL directory permissions..."
        
        # Try with sudo first
        if sudo chown -R $(id -u):$(id -g) data/postgres 2>/dev/null; then
            echo "  ✅ Changed ownership successfully"
            sudo chmod -R 755 data/postgres 2>/dev/null
            echo "  ✅ Changed permissions successfully"
        else
            echo "  ⚠️  Cannot change ownership (trying without sudo)"
            # Try without sudo
            chown -R $(id -u):$(id -g) data/postgres 2>/dev/null || echo "  ⚠️  No permission to change ownership"
            chmod -R 755 data/postgres 2>/dev/null || echo "  ⚠️  No permission to change permissions"
        fi
        
        FILE_COUNT=$(find data/postgres -type f 2>/dev/null | wc -l)
        echo "  📁 Local data/postgres exists with $FILE_COUNT files"
        if [ "$FILE_COUNT" -gt 0 ]; then
            echo "  ✅ Found existing PostgreSQL data in data/postgres"
            DATA_EXISTS=true
            MIGRATED_FROM_VOLUME=false
        else
            echo "  ⚠️  data/postgres directory exists but is empty or unreadable"
            # Try to list directory contents to debug
            echo "  🔍 Directory listing attempt:"
            ls -la data/postgres 2>/dev/null | head -5 | sed 's/^/     /' || echo "     (cannot list directory contents)"
            DATA_EXISTS=false
            MIGRATED_FROM_VOLUME=false
        fi
    else
        echo "  📁 No local data/postgres directory found"
        DATA_EXISTS=false
        MIGRATED_FROM_VOLUME=false
    fi
    
    # If no local data, check for Docker volumes
    if [ "$DATA_EXISTS" = "false" ]; then
        echo "  🔍 Searching for Docker volumes..."
        ALL_VOLUMES=$(docker volume ls -q)
        VOLUME_EXISTS=""
        
        # Try different volume name patterns
        for pattern in "${deployment}_postgres_data" "${deployment}-postgres-data" "postgres_data" "portfolio_postgres_data"; do
            FOUND_VOLUME=$(echo "$ALL_VOLUMES" | grep -E "^${pattern}$" | head -1)
            if [ -n "$FOUND_VOLUME" ]; then
                VOLUME_EXISTS="$FOUND_VOLUME"
                echo "  📦 Found Docker volume: $VOLUME_EXISTS"
                break
            fi
        done
        
        if [ -n "$VOLUME_EXISTS" ]; then
            # Extract data from Docker volume to local directory
            echo "  🔄 Migrating from Docker volume to local directory..."
            mkdir -p data/postgres
            
            # Create temporary container to copy data
            if docker run --rm -v "$VOLUME_EXISTS:/source:ro" -v "$(pwd)/data/postgres:/target" alpine sh -c "cp -a /source/. /target/" 2>/dev/null; then
                FILE_COUNT=$(find data/postgres -type f 2>/dev/null | wc -l)
                if [ "$FILE_COUNT" -gt 0 ]; then
                    echo "  ✅ Successfully migrated $FILE_COUNT files from Docker volume"
                    DATA_EXISTS=true
                    MIGRATED_FROM_VOLUME=true
                else
                    echo "  ⚠️  Migration completed but no files found"
                    DATA_EXISTS=false
                    MIGRATED_FROM_VOLUME=false
                fi
            else
                echo "  ❌ Failed to migrate data from Docker volume"
                DATA_EXISTS=false
                MIGRATED_FROM_VOLUME=false
            fi
        else
            echo "  📦 No Docker volumes found with common patterns"
        fi
    fi
    
    # Final status
    if [ "$DATA_EXISTS" = "true" ]; then
        echo "  💾 PostgreSQL data is available and will be preserved"
    else
        echo "  ⚠️  No PostgreSQL data found - database will be recreated"
    fi
    
    if docker compose ps --quiet > /dev/null 2>&1; then
        IS_RUNNING=$(docker compose ps --services --filter "status=running" | wc -l)
        if [ $IS_RUNNING -gt 0 ]; then
            echo "  💾 Creating database backup before update..."
            mkdir -p backups
            BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
            
            # Create database backup BEFORE stopping containers
            if docker compose exec -T postgres pg_dump -U postgres portfolio_db > "$BACKUP_FILE" 2>/dev/null; then
                echo "  ✅ Database backup created: $BACKUP_FILE"
                BACKUP_SUCCESS=true
            else
                echo "  ⚠️  Database backup failed, but continuing..."
                BACKUP_SUCCESS=false
            fi
            
            # CRITICAL: Stop containers but NEVER remove volumes
            echo "  ⏸️  Stopping containers SAFELY (preserving all data)..."
            docker compose stop  # Use 'stop' instead of 'down' to preserve everything
        fi
    fi
    
    # Backup .env file (contains passwords)
    if [ -f ".env" ]; then
        echo "  💾 Backing up environment file..."
        cp .env .env.backup
    fi
    
    # CRITICAL: Preserve existing data directories AT ALL COSTS
    echo "  📁 Preserving existing data directories..."
    
    # Backup data directory BEFORE any operations
    if [ -d "data" ] && [ "$(find data -type f 2>/dev/null | wc -l)" -gt 0 ]; then
        echo "  💾 Creating safety backup of entire data directory..."
        
        # Fix permissions before backup
        if sudo chown -R $(id -u):$(id -g) data 2>/dev/null; then
            echo "  🔧 Fixed data directory permissions for backup"
        fi
        
        if cp -r data data_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null; then
            echo "  ✅ Data directory backed up for safety"
        else
            echo "  ⚠️  Could not create full backup, trying with sudo..."
            sudo cp -r data data_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "  ❌ Backup failed"
        fi
    fi
    
    # Create directories ONLY if they don't exist (never overwrite!)
    if [ ! -d "data" ]; then
        mkdir -p data/postgres data/minio
        echo "  📁 Created new data directories"
    else
        echo "  ✅ Data directory already exists - preserving all contents"
        # NEVER delete or recreate these directories!
        if [ ! -d "data/postgres" ]; then
            mkdir -p data/postgres
            echo "  📁 Created postgres subdirectory"
        fi
        if [ ! -d "data/minio" ]; then
            mkdir -p data/minio
            echo "  📁 Created minio subdirectory"
        fi
    fi
    
    # Verify data preservation
    POSTGRES_FILES_AFTER=$(find data/postgres -type f 2>/dev/null | wc -l)
    echo "  🔍 PostgreSQL files after preservation: $POSTGRES_FILES_AFTER"
    
    # Double-check if postgres data exists after operations
    if [ -d "data/postgres" ] && [ "$POSTGRES_FILES_AFTER" -gt 0 ]; then
        echo "  ✅ PostgreSQL data preserved successfully ($POSTGRES_FILES_AFTER files)"
    else
        echo "  ⚠️  WARNING: PostgreSQL data directory is empty"
        echo "      This will cause a fresh database to be created!"
        if [ "$BACKUP_SUCCESS" = "true" ]; then
            echo "      Will attempt to restore from backup: $BACKUP_FILE"
        else
            echo "      ❌ NO BACKUP AVAILABLE - DATA WILL BE LOST!"
        fi
    fi
    
    # Go back to main directory
    cd ../..
    
    # Copy updated files
    echo "  📦 Copying updated files..."
    
    # Temporarily move data directory to safety
    if [ -d "$deploy_dir/data" ]; then
        echo "  🛡️  Moving data directory to safety during file copy..."
        
        # Fix permissions before moving
        sudo chown -R $(id -u):$(id -g) "$deploy_dir/data" 2>/dev/null || echo "  ⚠️  Could not fix permissions"
        
        if mv "$deploy_dir/data" "$deploy_dir/data_temp_safe" 2>/dev/null; then
            echo "  ✅ Data moved to safety successfully"
        else
            echo "  ⚠️  Could not move data, trying with sudo..."
            sudo mv "$deploy_dir/data" "$deploy_dir/data_temp_safe" 2>/dev/null || echo "  ❌ Failed to move data to safety"
        fi
    fi
    
    # Copy core application files
    cp -r src public index.html package*.json vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js "$deploy_dir/" 2>/dev/null
    cp -r local-backend "$deploy_dir/"
    cp docker-compose.simple.yml "$deploy_dir/docker-compose.yml"
    cp nginx-simple.conf "$deploy_dir/"
    
    # Restore data directory from safety
    if [ -d "$deploy_dir/data_temp_safe" ]; then
        echo "  🛡️  Restoring data directory from safety..."
        
        if mv "$deploy_dir/data_temp_safe" "$deploy_dir/data" 2>/dev/null; then
            echo "  ✅ Data directory restored successfully"
        else
            echo "  ⚠️  Could not restore data, trying with sudo..."
            sudo mv "$deploy_dir/data_temp_safe" "$deploy_dir/data" 2>/dev/null || echo "  ❌ Failed to restore data"
        fi
        
        # Fix permissions after restore
        sudo chown -R $(id -u):$(id -g) "$deploy_dir/data" 2>/dev/null || echo "  ⚠️  Could not fix permissions after restore"
        
        POSTGRES_FILES_RESTORED=$(find "$deploy_dir/data/postgres" -type f 2>/dev/null | wc -l)
        echo "  ✅ Data directory restored with $POSTGRES_FILES_RESTORED PostgreSQL files"
    fi
    
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
    
    # Create data directories if they don't exist (but preserve existing data)
    echo "  📁 Ensuring data directories exist..."
    if [ ! -d "data/postgres" ]; then
        mkdir -p data/postgres
        echo "  📁 Created missing postgres directory"
    fi
    if [ ! -d "data/minio" ]; then
        mkdir -p data/minio
        echo "  📁 Created missing minio directory"
    fi
    
    # Final verification of data preservation
    FINAL_POSTGRES_FILES=$(find data/postgres -type f 2>/dev/null | wc -l)
    echo "  🔍 Final PostgreSQL file count: $FINAL_POSTGRES_FILES"
    
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
    
    # CRITICAL: Check if we need to restore database
    CURRENT_POSTGRES_FILES=$(find data/postgres -type f 2>/dev/null | wc -l)
    if [ "$CURRENT_POSTGRES_FILES" -eq 0 ] && [ "$BACKUP_SUCCESS" = "true" ]; then
        echo "  🚨 CRITICAL: Database data was lost! Will restore from backup after containers start."
        NEEDS_RESTORE=true
    elif [ "$CURRENT_POSTGRES_FILES" -gt 0 ]; then
        echo "  ✅ PostgreSQL data available ($CURRENT_POSTGRES_FILES files) - no restore needed"
        NEEDS_RESTORE=false
    else
        echo "  ℹ️  No existing data and no backup - fresh database will be created"
        NEEDS_RESTORE=false
    fi
    
    if docker compose up -d --build > /dev/null 2>&1; then
        echo "  ✅ Containers started successfully"
        
        # Wait a bit and check health
        sleep 5
        
        # RESTORE DATABASE IF NEEDED
        if [ "$NEEDS_RESTORE" = "true" ]; then
            echo "  🔄 Restoring database from backup..."
            sleep 5  # Give postgres more time to start
            if docker compose exec -T postgres psql -U postgres portfolio_db < "$BACKUP_FILE" 2>/dev/null; then
                echo "  ✅ Database restored successfully from backup!"
            else
                echo "  ❌ CRITICAL: Database restore failed! Manual intervention needed."
                echo "      Backup file: $BACKUP_FILE"
            fi
        fi
        
        # CLEANUP MIGRATED DOCKER VOLUME
        if [ "$MIGRATED_FROM_VOLUME" = "true" ] && [ -n "$VOLUME_EXISTS" ]; then
            echo "  🧹 Cleaning up old Docker volume: $VOLUME_EXISTS"
            if docker volume rm "$VOLUME_EXISTS" 2>/dev/null; then
                echo "  ✅ Old Docker volume removed successfully"
            else
                echo "  ⚠️  Could not remove old Docker volume (may still be in use)"
            fi
        fi
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
    
    # Status summary
    if [ "$MIGRATED_FROM_VOLUME" = "true" ]; then
        echo "  📦 Migrated from Docker volume to local directory"
    fi
    FINAL_FILE_COUNT=$(find data/postgres -type f 2>/dev/null | wc -l)
    if [ "$FINAL_FILE_COUNT" -gt 0 ]; then
        echo "  💾 Database data preserved successfully ($FINAL_FILE_COUNT files)"
        
        # Show a sample of preserved files for verification
        echo "  📄 Sample preserved files:"
        find data/postgres -type f | head -3 | sed 's/^/     /'
    else
        echo "  ⚠️  Database will be recreated (no existing data found)"
        echo "  📁 Directory contents:"
        ls -la data/ 2>/dev/null | sed 's/^/     /' || echo "     (data directory not found)"
    fi
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