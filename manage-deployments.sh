#!/bin/bash

# Management script for multiple portfolio deployments
# Usage: ./manage-deployments.sh [command] [options]

show_help() {
    echo "Portfolio Multi-Deployment Manager"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy <name> <port> <backend-type> <backend-url> <api-key> <project-id>"
    echo "    Deploy a new portfolio site (backend-type: supabase|cloudbox)"
    echo ""
    echo "  list"
    echo "    List all running deployments"
    echo ""
    echo "  stop <name>"
    echo "    Stop a specific deployment"
    echo ""
    echo "  start <name>"
    echo "    Start a specific deployment"
    echo ""
    echo "  restart <name>"
    echo "    Restart a specific deployment"
    echo ""
    echo "  logs <name>"
    echo "    Show logs for a specific deployment"
    echo ""
    echo "  update <name>"
    echo "    Rebuild and restart a deployment"
    echo ""
    echo "  remove <name>"
    echo "    Remove a deployment completely"
    echo ""
    echo "  status"
    echo "    Show status of all deployments"
    echo ""
    echo "Examples:"
    echo "  $0 deploy client1 3001 supabase https://xyz.supabase.co your-key xyz"
    echo "  $0 deploy client2 3002 cloudbox https://cloudbox.doorkoppen.nl your-key project123"
    echo "  $0 list"
    echo "  $0 stop client1"
    echo "  $0 logs client1"
}

deploy_site() {
    local name=$1
    local port=$2
    local backend_type=$3
    local backend_url=$4
    local api_key=$5
    local project_id=$6
    
    if [ $# -ne 6 ]; then
        echo "❌ Error: deploy requires 6 arguments"
        echo "Usage: $0 deploy <name> <port> <backend-type> <backend-url> <api-key> <project-id>"
        exit 1
    fi
    
    # Run the deployment script
    ./deploy-new-site.sh "$name" "$port" "$backend_type" "$backend_url" "$api_key" "$project_id"
}

list_deployments() {
    echo "📋 Active Portfolio Deployments:"
    echo "================================"
    
    if [ -d "deployments" ]; then
        for dir in deployments/*/; do
            if [ -d "$dir" ]; then
                name=$(basename "$dir")
                echo "🏢 $name"
                
                # Check if container is running
                if docker ps --format "table {{.Names}}" | grep -q "^$name$"; then
                    port=$(docker port "$name" 80/tcp 2>/dev/null | cut -d':' -f2)
                    echo "   ✅ Status: Running"
                    echo "   🌐 URL: http://localhost:$port"
                else
                    echo "   ❌ Status: Stopped"
                fi
                echo ""
            fi
        done
    else
        echo "No deployments found."
    fi
}

manage_deployment() {
    local action=$1
    local name=$2
    local deploy_dir="deployments/$name"
    
    if [ ! -d "$deploy_dir" ]; then
        echo "❌ Error: Deployment '$name' not found"
        exit 1
    fi
    
    cd "$deploy_dir"
    
    case $action in
        "stop")
            echo "🛑 Stopping $name..."
            docker-compose down
            ;;
        "start")
            echo "🚀 Starting $name..."
            docker-compose up -d
            ;;
        "restart")
            echo "🔄 Restarting $name..."
            docker-compose restart
            ;;
        "logs")
            echo "📋 Showing logs for $name (Press Ctrl+C to exit):"
            docker-compose logs -f
            ;;
        "update")
            echo "🔄 Updating $name..."
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
            echo "✅ Update complete!"
            ;;
        "remove")
            echo "🗑️  Removing $name..."
            read -p "Are you sure you want to remove '$name'? (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                docker-compose down
                docker rmi "$name:latest" 2>/dev/null || true
                cd ../..
                rm -rf "$deploy_dir"
                echo "✅ Deployment '$name' removed completely"
            else
                echo "❌ Removal cancelled"
            fi
            ;;
    esac
}

show_status() {
    echo "📊 Portfolio Deployments Status:"
    echo "================================"
    
    # Docker containers
    echo "🐳 Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(portfolio|client)" || echo "No portfolio containers running"
    
    echo ""
    echo "💾 Disk Usage:"
    if [ -d "deployments" ]; then
        du -sh deployments/* 2>/dev/null | sed 's/^/   /'
    fi
    
    echo ""
    echo "🔧 Docker Images:"
    docker images | grep -E "(portfolio|client)" | head -10 || echo "No portfolio images found"
}

# Main script logic
case "$1" in
    "deploy")
        shift
        deploy_site "$@"
        ;;
    "list")
        list_deployments
        ;;
    "stop"|"start"|"restart"|"logs"|"update"|"remove")
        if [ -z "$2" ]; then
            echo "❌ Error: Please specify deployment name"
            echo "Usage: $0 $1 <deployment-name>"
            exit 1
        fi
        manage_deployment "$1" "$2"
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo "❌ Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac