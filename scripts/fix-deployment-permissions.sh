#!/bin/bash

# Fix Docker permissions for deployment
# Usage: ./fix-deployment-permissions.sh [deployment-name]
# Must be run as root or with sudo on the server

DEPLOYMENT_NAME=${1}

if [ -z "$DEPLOYMENT_NAME" ]; then
    echo "❌ Usage: $0 [deployment-name]"
    echo "Example: $0 wouterkoppen"
    exit 1
fi

DEPLOYMENT_DIR="/path/to/deployments/$DEPLOYMENT_NAME"

if [ ! -d "$DEPLOYMENT_DIR" ]; then
    echo "❌ Error: Deployment directory $DEPLOYMENT_DIR does not exist"
    exit 1
fi

echo "🔧 Fixing Docker permissions for deployment: $DEPLOYMENT_NAME"
echo "=============================================="
echo ""

# Stop containers first
echo "🛑 Stopping containers..."
cd "$DEPLOYMENT_DIR"
docker-compose down

# Check current permissions
echo ""
echo "📋 Current permissions:"
ls -la data/ 2>/dev/null || echo "No data directory found"

# Fix data directory permissions
echo ""
echo "🔑 Fixing permissions..."

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
fi

# Set ownership to user 1000:1000 (Docker user)
echo "👤 Setting ownership to user 1000:1000..."
chown -R 1000:1000 data/

# Set proper permissions
echo "🔒 Setting permissions..."
chmod -R 755 data/

# Also fix any existing volume data
echo ""
echo "🗄️  Fixing Docker volume permissions..."

# Get volume names for this deployment
POSTGRES_VOLUME="${DEPLOYMENT_NAME}_postgres_data"
MINIO_VOLUME="${DEPLOYMENT_NAME}_minio_data"

# Check if volumes exist and fix their permissions
if docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1; then
    echo "📊 Fixing PostgreSQL volume permissions..."
    docker run --rm -v "$POSTGRES_VOLUME":/data alpine sh -c "chown -R 999:999 /data && chmod -R 700 /data"
fi

if docker volume inspect "$MINIO_VOLUME" >/dev/null 2>&1; then
    echo "💾 Fixing MinIO volume permissions..."
    docker run --rm -v "$MINIO_VOLUME":/data alpine sh -c "chown -R 1000:1000 /data && chmod -R 755 /data"
fi

# Fix any other deployment files
echo ""
echo "📄 Fixing deployment file permissions..."
chown -R 1000:1000 "$DEPLOYMENT_DIR" || echo "⚠️ Could not change ownership of deployment directory"
find "$DEPLOYMENT_DIR" -name "*.sh" -exec chmod +x {} \;

echo ""
echo "✅ Permissions fixed!"
echo ""
echo "📋 New permissions:"
ls -la data/ 2>/dev/null || echo "No data directory"

echo ""
echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "✨ Done! Deployment should now start properly."
echo ""
echo "🔍 To check if everything is working:"
echo "   docker-compose ps"
echo "   docker-compose logs -f"