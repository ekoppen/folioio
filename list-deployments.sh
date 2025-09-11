#!/bin/bash

# List all deployments and their status
# Usage: ./list-deployments.sh

echo "📋 Portfolio Deployments Overview"
echo "================================="

if [ ! -d "deployments" ]; then
    echo "ℹ️  No deployments directory found."
    exit 0
fi

DEPLOYMENTS=($(find deployments -mindepth 1 -maxdepth 1 -type d -exec basename {} \;))

if [ ${#DEPLOYMENTS[@]} -eq 0 ]; then
    echo "ℹ️  No deployments found."
    exit 0
fi

echo "Found ${#DEPLOYMENTS[@]} deployment(s):"
echo ""

for deployment in "${DEPLOYMENTS[@]}"; do
    deploy_dir="deployments/$deployment"
    echo "🏗️  $deployment"
    echo "   📍 Path: $deploy_dir"
    
    if [ -f "$deploy_dir/.env" ]; then
        FRONTEND_PORT=$(grep "FRONTEND_PORT=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
        MINIO_CONSOLE_PORT=$(grep "MINIO_CONSOLE_PORT=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
        CONTAINER_NAME=$(grep "CONTAINER_NAME=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
        
        echo "   🌐 Site: http://localhost:${FRONTEND_PORT:-unknown}"
        if [ -n "$MINIO_CONSOLE_PORT" ]; then
            echo "   🗄️  MinIO: http://localhost:$MINIO_CONSOLE_PORT"
        fi
    fi
    
    # Check if running
    cd "$deploy_dir" 2>/dev/null
    if [ $? -eq 0 ] && docker compose ps --quiet > /dev/null 2>&1; then
        RUNNING_SERVICES=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)
        TOTAL_SERVICES=$(docker compose ps --services 2>/dev/null | wc -l)
        
        if [ $RUNNING_SERVICES -gt 0 ]; then
            if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
                echo "   ✅ Status: Running ($RUNNING_SERVICES/$TOTAL_SERVICES services healthy)"
            else
                echo "   ⚠️  Status: Partially running ($RUNNING_SERVICES/$TOTAL_SERVICES services)"
            fi
        else
            echo "   ❌ Status: Stopped"
        fi
    else
        echo "   ❓ Status: Unknown (no docker-compose.yml or docker not available)"
    fi
    
    cd - > /dev/null 2>&1
    echo ""
done

echo "💡 Quick commands:"
echo "   ./update-deployments.sh     # Update all deployments"
echo "   ./check-ports.sh            # Check port availability"
echo "   ./remove-deployment.sh <name>  # Remove specific deployment"
echo "   ./cleanup-deployments.sh    # Interactive cleanup utility"
echo "   cd deployments/<name>       # Go to specific deployment"
echo ""