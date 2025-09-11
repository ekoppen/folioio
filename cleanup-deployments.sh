#!/bin/bash

# Cleanup multiple deployments script
# Usage: ./cleanup-deployments.sh
# Interactive script to clean up multiple deployments at once

echo "🧹 Portfolio Deployments Cleanup"
echo "================================"

# Check if deployments exist
if [ ! -d "deployments" ]; then
    echo "ℹ️  No deployments directory found. Nothing to cleanup."
    exit 0
fi

DEPLOYMENTS=($(find deployments -mindepth 1 -maxdepth 1 -type d -exec basename {} \;))

if [ ${#DEPLOYMENTS[@]} -eq 0 ]; then
    echo "ℹ️  No deployments found. Nothing to cleanup."
    exit 0
fi

echo "Found ${#DEPLOYMENTS[@]} deployment(s):"
echo ""

# Show all deployments with details
for i in "${!DEPLOYMENTS[@]}"; do
    deployment=${DEPLOYMENTS[$i]}
    deploy_dir="deployments/$deployment"
    
    printf "%2d. %s" $((i+1)) "$deployment"
    
    if [ -f "$deploy_dir/.env" ]; then
        FRONTEND_PORT=$(grep "FRONTEND_PORT=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
        MINIO_CONSOLE_PORT=$(grep "MINIO_CONSOLE_PORT=" "$deploy_dir/.env" 2>/dev/null | cut -d'=' -f2)
        
        printf " (Frontend: %s, MinIO: %s)" "${FRONTEND_PORT:-?}" "${MINIO_CONSOLE_PORT:-?}"
        
        # Check if running
        cd "$deploy_dir" 2>/dev/null
        if [ $? -eq 0 ] && docker compose ps --quiet > /dev/null 2>&1; then
            RUNNING_SERVICES=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)
            if [ $RUNNING_SERVICES -gt 0 ]; then
                printf " [RUNNING]"
            else
                printf " [STOPPED]"
            fi
        fi
        cd - > /dev/null 2>&1
    fi
    echo ""
done

echo ""
echo "🗑️  Cleanup Options:"
echo "   a) Remove ALL deployments"
echo "   s) Select specific deployments to remove"
echo "   c) Cancel"
echo ""

read -p "Choose an option (a/s/c): " -n 1 -r
echo

case $REPLY in
    [Aa]*)
        echo ""
        echo "⚠️  WARNING: This will remove ALL ${#DEPLOYMENTS[@]} deployments!"
        echo "   All containers, volumes, and data will be permanently lost."
        echo ""
        read -p "Type 'DELETE ALL' to confirm complete removal: " -r
        if [ "$REPLY" = "DELETE ALL" ]; then
            echo ""
            echo "🧹 Removing all deployments..."
            for deployment in "${DEPLOYMENTS[@]}"; do
                echo "🗑️  Removing $deployment..."
                ./remove-deployment.sh "$deployment" <<< "DELETE"
                echo ""
            done
            echo "✅ All deployments removed!"
        else
            echo "❌ Removal cancelled."
        fi
        ;;
    [Ss]*)
        echo ""
        echo "📝 Select deployments to remove (space-separated numbers, e.g., '1 3 5'):"
        read -p "Deployments to remove: " -r selection
        
        # Convert selection to array
        IFS=' ' read -ra SELECTED <<< "$selection"
        
        # Validate selection
        VALID_DEPLOYMENTS=()
        for num in "${SELECTED[@]}"; do
            if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le ${#DEPLOYMENTS[@]} ]; then
                VALID_DEPLOYMENTS+=(${DEPLOYMENTS[$((num-1))]})
            else
                echo "⚠️  Invalid selection: $num (ignored)"
            fi
        done
        
        if [ ${#VALID_DEPLOYMENTS[@]} -eq 0 ]; then
            echo "❌ No valid deployments selected."
            exit 1
        fi
        
        echo ""
        echo "Selected deployments for removal:"
        for deployment in "${VALID_DEPLOYMENTS[@]}"; do
            echo "  - $deployment"
        done
        
        echo ""
        read -p "Confirm removal of ${#VALID_DEPLOYMENTS[@]} deployment(s)? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            for deployment in "${VALID_DEPLOYMENTS[@]}"; do
                echo "🗑️  Removing $deployment..."
                ./remove-deployment.sh "$deployment" <<< "DELETE"
                echo ""
            done
            echo "✅ Selected deployments removed!"
        else
            echo "❌ Removal cancelled."
        fi
        ;;
    *)
        echo "❌ Cleanup cancelled."
        ;;
esac

echo ""
echo "💡 Useful commands:"
echo "   ./list-deployments.sh     # Show remaining deployments"
echo "   ./check-ports.sh          # Check available ports"
echo "   docker system prune -a    # Clean up all unused Docker resources"
echo ""