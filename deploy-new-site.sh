#!/bin/bash

# Multi-backend deployment script
# Usage: ./deploy-new-site.sh <site-name> <port> <backend-type> <backend-url> <api-key> <project-id>

source backends/shared-functions.sh

SITE_NAME=$1
PORT=$2
BACKEND_TYPE=$3
BACKEND_URL=$4
API_KEY=$5
PROJECT_ID=$6

if [ $# -lt 3 ]; then
    echo "Usage: $0 <site-name> <port> <backend-type> [backend-url] [api-key] [project-id]"
    echo ""
    echo "Backend types: supabase, cloudbox, local"
    echo ""
    echo "Examples:"
    echo "  Supabase: $0 client1 3001 supabase https://xyz.supabase.co your-anon-key xyz"
    echo "  Cloudbox: $0 client2 3002 cloudbox https://cloudbox.doorkoppen.nl your-api-key project123"
    echo "  Local:    $0 client3 3003 local"
    exit 1
fi

# Route to appropriate backend deployment
case $BACKEND_TYPE in
    "supabase")
        if [ $# -ne 6 ]; then
            echo "Error: Supabase deployment requires all 6 parameters"
            exit 1
        fi
        source backends/supabase-deploy.sh
        deploy_supabase "$SITE_NAME" "$PORT" "$BACKEND_URL" "$API_KEY" "$PROJECT_ID"
        ;;
    "cloudbox")
        if [ $# -ne 6 ]; then
            echo "Error: Cloudbox deployment requires all 6 parameters"
            exit 1
        fi
        source backends/cloudbox-deploy.sh
        deploy_cloudbox "$SITE_NAME" "$PORT" "$BACKEND_URL" "$API_KEY" "$PROJECT_ID"
        ;;
    "local")
        source backends/local-deploy.sh
        deploy_local "$SITE_NAME" "$PORT" "$BACKEND_URL" "$API_KEY" "$PROJECT_ID"
        ;;
    *)
        log_error "Unknown backend type: $BACKEND_TYPE"
        echo "Supported backends: supabase, cloudbox, local"
        exit 1
        ;;
esac