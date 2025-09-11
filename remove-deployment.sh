#!/bin/bash

# Remove deployment script for portfolio sites
# Usage: ./remove-deployment.sh <site-name>
# This script safely removes a deployment with confirmation

SITE_NAME=$1

echo "🗑️  Portfolio Deployment Removal Script"
echo "======================================"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <site-name>"
    echo ""
    echo "Available deployments:"
    if [ -d "deployments" ]; then
        ls -1 deployments/ 2>/dev/null | sed 's/^/  - /' || echo "  (no deployments found)"
    else
        echo "  (no deployments directory found)"
    fi
    exit 1
fi

DEPLOY_DIR="deployments/$SITE_NAME"

# Check if deployment exists
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Error: Deployment '$SITE_NAME' not found"
    echo ""
    echo "Available deployments:"
    if [ -d "deployments" ]; then
        ls -1 deployments/ 2>/dev/null | sed 's/^/  - /' || echo "  (no deployments found)"
    else
        echo "  (no deployments directory found)"
    fi
    exit 1
fi

echo "📍 Found deployment: $DEPLOY_DIR"

# Get deployment info
cd "$DEPLOY_DIR"
FRONTEND_PORT=""
MINIO_CONSOLE_PORT=""
CONTAINER_NAME=""

if [ -f ".env" ]; then
    FRONTEND_PORT=$(grep "FRONTEND_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    MINIO_CONSOLE_PORT=$(grep "MINIO_CONSOLE_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    CONTAINER_NAME=$(grep "CONTAINER_NAME=" .env 2>/dev/null | cut -d'=' -f2)
    
    echo "🔍 Deployment details:"
    echo "   🌐 Site URL: http://localhost:${FRONTEND_PORT:-unknown}"
    if [ -n "$MINIO_CONSOLE_PORT" ]; then
        echo "   🗄️  MinIO Console: http://localhost:$MINIO_CONSOLE_PORT"
    fi
    echo "   📦 Container prefix: ${CONTAINER_NAME:-unknown}"
fi

# Check if containers are running
RUNNING_CONTAINERS=()
if docker compose ps --quiet > /dev/null 2>&1; then
    RUNNING_SERVICES=$(docker compose ps --services --filter "status=running" 2>/dev/null)
    if [ -n "$RUNNING_SERVICES" ]; then
        echo "⚠️  Warning: Some containers are currently running:"
        echo "$RUNNING_SERVICES" | sed 's/^/     - /'
        CONTAINERS_RUNNING=true
    else
        echo "ℹ️  No containers currently running"
        CONTAINERS_RUNNING=false
    fi
else
    echo "ℹ️  No docker-compose.yml found or docker not available"
    CONTAINERS_RUNNING=false
fi

cd ../..

echo ""
echo "⚠️  WARNING: This will permanently remove:"
echo "   📁 All deployment files in $DEPLOY_DIR"
echo "   🐳 All Docker containers for this deployment"
echo "   💾 All Docker volumes (databases, uploaded files, etc.)"
echo "   🔌 Free up ports: $FRONTEND_PORT, $MINIO_CONSOLE_PORT"
echo ""
echo "❗ This action CANNOT be undone!"
echo "   All content, photos, and database data will be lost."
echo ""

# Confirmation prompt
read -p "Are you absolutely sure you want to remove '$SITE_NAME'? (type 'DELETE' to confirm): " -r
if [ "$REPLY" != "DELETE" ]; then
    echo "❌ Removal cancelled. Deployment preserved."
    exit 0
fi

echo ""
echo "🧹 Starting removal process..."

# Go to deployment directory
cd "$DEPLOY_DIR"

# Stop and remove containers
if [ "$CONTAINERS_RUNNING" = true ] || [ -f "docker-compose.yml" ]; then
    echo "⏸️  Stopping containers..."
    docker compose down 2>/dev/null
    
    echo "🗑️  Removing containers and volumes..."
    docker compose down -v 2>/dev/null
    
    # Clean up any remaining containers with our prefix
    if [ -n "$CONTAINER_NAME" ]; then
        echo "🧽 Cleaning up remaining containers..."
        docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}" | tail -n +2 | while read container; do
            if [ -n "$container" ]; then
                echo "   Removing container: $container"
                docker rm -f "$container" 2>/dev/null || true
            fi
        done
        
        # Clean up volumes
        docker volume ls --filter "name=${CONTAINER_NAME}" --format "table {{.Name}}" | tail -n +2 | while read volume; do
            if [ -n "$volume" ]; then
                echo "   Removing volume: $volume"
                docker volume rm "$volume" 2>/dev/null || true
            fi
        done
    fi
fi

# Go back to main directory
cd ../..

# Create backup before deletion (just the .env file for reference)
BACKUP_DIR="deployment-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/${SITE_NAME}-$(date +%Y%m%d-%H%M%S).env"

if [ -f "$DEPLOY_DIR/.env" ]; then
    echo "💾 Creating backup of environment file..."
    cp "$DEPLOY_DIR/.env" "$BACKUP_FILE"
    echo "   Backup saved to: $BACKUP_FILE"
fi

# Remove deployment directory
echo "🗂️  Removing deployment directory..."
rm -rf "$DEPLOY_DIR"

# Final cleanup - prune unused volumes
echo "🧽 Cleaning up unused Docker resources..."
docker system prune -f > /dev/null 2>&1 || true

echo ""
echo "✅ Removal completed successfully!"
echo ""
echo "📊 Summary:"
echo "   🗑️  Removed deployment: $SITE_NAME"
echo "   📁 Deleted directory: $DEPLOY_DIR"
echo "   🔌 Freed ports: $FRONTEND_PORT, $MINIO_CONSOLE_PORT"
if [ -f "$BACKUP_FILE" ]; then
    echo "   💾 Environment backup: $BACKUP_FILE"
fi
echo ""
echo "💡 Remaining deployments:"
if [ -d "deployments" ] && [ "$(ls -A deployments/ 2>/dev/null)" ]; then
    ls -1 deployments/ | sed 's/^/   - /'
else
    echo "   (no deployments remaining)"
fi
echo ""
echo "🔧 Useful commands:"
echo "   ./list-deployments.sh     # Show remaining deployments"
echo "   ./check-ports.sh          # Check available ports"
echo "   ./deploy-simple.sh        # Create new deployment"
echo ""