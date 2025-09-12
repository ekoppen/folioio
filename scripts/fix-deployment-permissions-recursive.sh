#!/bin/bash

# Fix Docker permissions recursively for deployment
# Usage: ./fix-deployment-permissions-recursive.sh [deployment-name]
# Must be run as root or with sudo on the server

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

echo "🔧 Fixing Docker permissions recursively for: $DEPLOYMENT_NAME"
echo "=============================================================="

cd "$DEPLOYMENT_DIR"

# Stop containers first
echo "🛑 Stopping containers..."
docker-compose down

echo ""
echo "🔑 Fixing all permissions recursively..."

# Fix data directory if it exists
if [ -d "data" ]; then
    echo "📁 Fixing data directory permissions..."
    find data -type d -exec chmod 755 {} \;
    find data -type f -exec chmod 644 {} \;
    chown -R 1000:1000 data/
    echo "✅ Data directory fixed"
else
    echo "📁 Creating and setting up data directory..."
    mkdir -p data
    chown 1000:1000 data
    chmod 755 data
fi

# Fix Docker volumes
echo ""
echo "🗄️ Fixing Docker volume permissions..."

POSTGRES_VOLUME="${DEPLOYMENT_NAME}_postgres_data"
MINIO_VOLUME="${DEPLOYMENT_NAME}_minio_data"

if docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1; then
    echo "📊 Fixing PostgreSQL volume..."
    docker run --rm -v "$POSTGRES_VOLUME":/data alpine sh -c "
        find /data -type d -exec chmod 700 {} \;
        find /data -type f -exec chmod 600 {} \;
        chown -R 999:999 /data
    " && echo "✅ PostgreSQL volume fixed"
fi

if docker volume inspect "$MINIO_VOLUME" >/dev/null 2>&1; then
    echo "💾 Fixing MinIO volume..."
    docker run --rm -v "$MINIO_VOLUME":/data alpine sh -c "
        find /data -type d -exec chmod 755 {} \;
        find /data -type f -exec chmod 644 {} \;
        chown -R 1000:1000 /data
    " && echo "✅ MinIO volume fixed"
fi

# Fix deployment directory permissions
echo ""
echo "📄 Fixing deployment file permissions..."
find . -name "*.sh" -exec chmod +x {} \;
chown -R 1000:1000 . 2>/dev/null || echo "⚠️ Could not change ownership of entire deployment directory"

echo ""
echo "✅ All permissions fixed!"

echo ""
echo "🚀 Restarting containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Container status:"
docker-compose ps

echo ""
echo "✨ Done! Check logs with: docker-compose logs -f"