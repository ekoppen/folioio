#!/bin/bash

# Fix Docker volume permissions for specific deployment
# Usage: ./fix-volume-permissions.sh [deployment-name]

DEPLOYMENT_NAME=${1}

if [ -z "$DEPLOYMENT_NAME" ]; then
    echo "❌ Usage: $0 [deployment-name]"
    echo "Example: $0 wouterkoppen"
    exit 1
fi

echo "🔧 Fixing Docker volume permissions for: $DEPLOYMENT_NAME"
echo "================================================="

# Stop containers first
echo "🛑 Stopping containers..."
cd "deployments/$DEPLOYMENT_NAME"
docker-compose down

# Fix PostgreSQL volume permissions
POSTGRES_VOLUME="${DEPLOYMENT_NAME}_postgres_data"
if docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1; then
    echo "📊 Fixing PostgreSQL volume permissions..."
    
    # Remove and recreate the volume to ensure clean state
    docker volume rm "$POSTGRES_VOLUME" || true
    docker volume create "$POSTGRES_VOLUME"
    
    # Set proper permissions using a temporary container
    docker run --rm -v "$POSTGRES_VOLUME":/var/lib/postgresql/data alpine sh -c "
        chown -R 70:70 /var/lib/postgresql/data
        chmod -R 700 /var/lib/postgresql/data
    "
    
    echo "✅ PostgreSQL volume recreated with proper permissions"
else
    echo "🔍 PostgreSQL volume not found, will be created with proper permissions"
fi

# Fix MinIO volume permissions
MINIO_VOLUME="${DEPLOYMENT_NAME}_minio_data"
if docker volume inspect "$MINIO_VOLUME" >/dev/null 2>&1; then
    echo "💾 Fixing MinIO volume permissions..."
    
    # Remove and recreate the volume
    docker volume rm "$MINIO_VOLUME" || true
    docker volume create "$MINIO_VOLUME"
    
    # Set proper permissions
    docker run --rm -v "$MINIO_VOLUME":/data alpine sh -c "
        chown -R 1000:1000 /data
        chmod -R 755 /data
    "
    
    echo "✅ MinIO volume recreated with proper permissions"
else
    echo "🔍 MinIO volume not found, will be created with proper permissions"
fi

echo ""
echo "🚀 Starting containers with clean volumes..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 20

echo ""
echo "🔍 Container status:"
docker-compose ps

echo ""
echo "✨ Volume permissions fixed! Check logs with: docker-compose logs -f"