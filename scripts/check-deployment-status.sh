#!/bin/bash

# Check deployment status and diagnose issues
# Usage: ./check-deployment-status.sh [deployment-name]

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

echo "🔍 Checking deployment status: $DEPLOYMENT_NAME"
echo "==============================================="

cd "$DEPLOYMENT_DIR"

echo ""
echo "📊 Container Status:"
echo "-------------------"
docker-compose ps

echo ""
echo "📁 Directory Permissions:"
echo "-------------------------"
echo "Deployment directory:"
ls -la . | head -5

if [ -d "data" ]; then
    echo ""
    echo "Data directory:"
    ls -la data/
else
    echo ""
    echo "⚠️ No data directory found"
fi

echo ""
echo "🐳 Docker Volumes:"
echo "------------------"
docker volume ls | grep "${DEPLOYMENT_NAME}" || echo "No named volumes found for this deployment"

echo ""
echo "💾 Volume Details:"
echo "------------------"
POSTGRES_VOLUME="${DEPLOYMENT_NAME}_postgres_data"
MINIO_VOLUME="${DEPLOYMENT_NAME}_minio_data"

if docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1; then
    echo "PostgreSQL volume exists: $POSTGRES_VOLUME"
    docker run --rm -v "$POSTGRES_VOLUME":/data alpine ls -la /data | head -5
else
    echo "PostgreSQL volume not found: $POSTGRES_VOLUME"
fi

if docker volume inspect "$MINIO_VOLUME" >/dev/null 2>&1; then
    echo "MinIO volume exists: $MINIO_VOLUME"
    docker run --rm -v "$MINIO_VOLUME":/data alpine ls -la /data | head -5
else
    echo "MinIO volume not found: $MINIO_VOLUME"
fi

echo ""
echo "📋 Recent Container Logs:"
echo "-------------------------"
echo "API logs (last 10 lines):"
docker logs "${DEPLOYMENT_NAME}-api" --tail=10 2>/dev/null || echo "API container not running"

echo ""
echo "Database logs (last 10 lines):"
docker logs "${DEPLOYMENT_NAME}-db" --tail=10 2>/dev/null || echo "Database container not running"

echo ""
echo "🔧 Quick Fixes:"
echo "---------------"
echo "If you see permission errors, run:"
echo "  sudo ./fix-deployment-permissions.sh $DEPLOYMENT_NAME"
echo ""
echo "If containers won't start, try:"
echo "  docker-compose down && docker-compose up -d"
echo ""
echo "To view live logs:"
echo "  docker-compose logs -f"