#!/bin/bash

# Fix Docker permissions without sudo using Docker containers
# Usage: ./fix-permissions-no-sudo.sh [deployment-name]

DEPLOYMENT_NAME=${1}

if [ -z "$DEPLOYMENT_NAME" ]; then
    echo "❌ Usage: $0 [deployment-name]"
    echo "Example: $0 wouterkoppen"
    exit 1
fi

DEPLOYMENT_DIR="deployments/$DEPLOYMENT_NAME"

if [ ! -d "$DEPLOYMENT_DIR" ]; then
    echo "❌ Error: Deployment directory $DEPLOYMENT_DIR does not exist"
    exit 1
fi

echo "🔧 Fixing permissions without sudo for: $DEPLOYMENT_NAME"
echo "===================================================="

cd "$DEPLOYMENT_DIR"

# Fix local data directory using Docker
if [ -d "data" ]; then
    echo "📁 Fixing data directory permissions using Docker..."
    docker run --rm -v "$(pwd)/data:/fix-data" alpine sh -c "
        echo 'Setting permissions for all files and directories...'
        find /fix-data -type d -exec chmod 755 {} \; 2>/dev/null || true
        find /fix-data -type f -exec chmod 644 {} \; 2>/dev/null || true
        echo 'Setting ownership to user 1000:1000...'  
        chown -R 1000:1000 /fix-data 2>/dev/null || true
        echo 'Permissions set successfully!'
    " && echo "✅ Data directory permissions fixed"
fi

# Fix Docker volumes
echo ""
echo "🗄️ Fixing Docker volume permissions..."

POSTGRES_VOLUME="${DEPLOYMENT_NAME}_postgres_data"
MINIO_VOLUME="${DEPLOYMENT_NAME}_minio_data"

if docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1; then
    echo "📊 Fixing PostgreSQL volume..."
    docker run --rm -v "$POSTGRES_VOLUME":/data alpine sh -c "
        find /data -type d -exec chmod 700 {} \; 2>/dev/null || true
        find /data -type f -exec chmod 600 {} \; 2>/dev/null || true
        chown -R 999:999 /data 2>/dev/null || true
    " && echo "✅ PostgreSQL volume fixed"
fi

if docker volume inspect "$MINIO_VOLUME" >/dev/null 2>&1; then
    echo "💾 Fixing MinIO volume..."
    docker run --rm -v "$MINIO_VOLUME":/data alpine sh -c "
        find /data -type d -exec chmod 755 {} \; 2>/dev/null || true
        find /data -type f -exec chmod 644 {} \; 2>/dev/null || true
        chown -R 1000:1000 /data 2>/dev/null || true
    " && echo "✅ MinIO volume fixed"
fi

echo ""
echo "🔄 Restarting containers to apply changes..."
docker-compose down
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "✅ All permissions fixed without sudo!"
echo ""
echo "🔍 Container status:"
docker-compose ps