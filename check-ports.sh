#!/bin/bash

echo "🔍 Checking port usage for deployments..."
echo "========================================="

# Check common deployment ports
echo ""
echo "📡 Common frontend ports:"
for port in 8080 8081 8082 8083 8084 8085; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is in use"
    else
        echo "✅ Port $port is free"
    fi
done

echo ""
echo "🗄️  Common MinIO console ports:"
for port in 9080 9081 9082 9083 9084 9085; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is in use"
    else
        echo "✅ Port $port is free"
    fi
done

echo ""
echo "🔧 Other service ports:"
for port in 3001 5433 9001 9003 9004; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is in use"
    else
        echo "✅ Port $port is free"
    fi
done

# Check existing deployments
echo ""
echo "📋 Existing deployment ports:"
if [ -d "deployments" ]; then
    for deploy_dir in deployments/*/; do
        if [ -f "$deploy_dir/.env" ]; then
            site_name=$(basename "$deploy_dir")
            frontend_port=$(grep "FRONTEND_PORT=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
            minio_port=$(grep "MINIO_CONSOLE_PORT=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
            
            if [ -n "$frontend_port" ]; then
                echo "🏗️  $site_name: Frontend=$frontend_port, MinIO=$minio_port"
            fi
        fi
    done
else
    echo "ℹ️  No deployments directory found"
fi

echo ""
echo "💡 Tip: Use './deploy-simple.sh <name> <port>' to deploy with specific port"
echo "   The script will automatically find available MinIO console ports"