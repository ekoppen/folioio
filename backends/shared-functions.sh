#!/bin/bash

# Shared functions for deployment scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Validation functions
validate_port() {
    local port=$1
    if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        log_error "Invalid port number: $port. Must be between 1024-65535"
        return 1
    fi
    return 0
}

validate_site_name() {
    local name=$1
    if ! [[ "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Invalid site name: $name. Only alphanumeric characters, hyphens, and underscores allowed"
        return 1
    fi
    return 0
}

validate_url() {
    local url=$1
    if ! [[ "$url" =~ ^https?:// ]]; then
        log_error "Invalid URL: $url. Must start with http:// or https://"
        return 1
    fi
    return 0
}

# Check if port is already in use
check_port_available() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        log_error "Port $port is already in use"
        return 1
    fi
    return 0
}

# Check if deployment already exists
check_deployment_exists() {
    local name=$1
    if [ -d "deployments/$name" ]; then
        log_error "Deployment '$name' already exists"
        return 1
    fi
    return 0
}

# Create deployment directory structure
create_deployment_dir() {
    local deploy_dir=$1
    local site_name=$2
    
    # Get the absolute path of the source directory (parent of backends directory)
    local source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    
    log_info "Source directory: $source_dir"
    log_info "Deployment directory: $deploy_dir"
    
    # Ensure we're using absolute path for deploy_dir
    if [[ ! "$deploy_dir" = /* ]]; then
        deploy_dir="$source_dir/$deploy_dir"
    fi
    
    mkdir -p "$deploy_dir"
    
    # Copy current codebase (excluding deployments folder to avoid recursion)
    log_step "Copying codebase to deployment directory..."
    
    # Change to source directory to ensure we're copying from the right place
    cd "$source_dir"
    
    # First, copy everything except excluded folders
    rsync -av --exclude='deployments' --exclude='deployments/*' --exclude='.git' --exclude='node_modules' --exclude='.env*' . "$deploy_dir/"
    
    # Debug: Check what files were actually copied
    log_info "Checking copied files..."
    ls -la "$deploy_dir/" | head -20
    
    # Ensure critical files are present - copy them explicitly if needed
    for file in "Dockerfile" "nginx.conf" "package.json" "tailwind.config.ts" "vite.config.ts" "index.html"; do
        if [ ! -f "$deploy_dir/$file" ] && [ -f "$source_dir/$file" ]; then
            log_warning "$file not found in deployment dir, copying explicitly..."
            cp "$source_dir/$file" "$deploy_dir/" || {
                log_error "Failed to copy $file"
                return 1
            }
            log_success "$file copied successfully"
        elif [ -f "$deploy_dir/$file" ]; then
            log_success "$file found in deployment directory"
        else
            log_error "$file not found in source directory: $source_dir/$file"
            # List files in source directory for debugging
            log_info "Files in source directory:"
            ls -la "$source_dir/$file" 2>/dev/null || log_error "File really doesn't exist: $source_dir/$file"
            return 1
        fi
    done
    
    # Ensure src directory is copied (needed for Vite build)
    if [ -d "$source_dir/src" ] && [ ! -d "$deploy_dir/src" ]; then
        log_warning "src directory not found in deployment dir, copying explicitly..."
        cp -r "$source_dir/src" "$deploy_dir/" || {
            log_error "Failed to copy src directory"
            return 1
        }
        log_success "src directory copied successfully"
    elif [ -d "$deploy_dir/src" ]; then
        log_success "src directory found in deployment directory"
    fi
    
    # Ensure public directory is copied if it exists
    if [ -d "$source_dir/public" ] && [ ! -d "$deploy_dir/public" ]; then
        log_warning "public directory not found in deployment dir, copying explicitly..."
        cp -r "$source_dir/public" "$deploy_dir/" || {
            log_error "Failed to copy public directory"
            return 1
        }
        log_success "public directory copied successfully"
    elif [ -d "$deploy_dir/public" ]; then
        log_success "public directory found in deployment directory"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Codebase copied successfully"
    else
        log_error "Failed to copy codebase"
        return 1
    fi
    
    return 0
}

# Create Docker Compose file
create_docker_compose() {
    local deploy_dir=$1
    local site_name=$2
    local port=$3
    
    cat > "$deploy_dir/docker-compose.yml" << EOF
services:
  $site_name:
    build: .
    ports:
      - "$port:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    container_name: $site_name
    labels:
      - "com.portfolio.site_name=$site_name"
      - "com.portfolio.port=$port"
      - "com.portfolio.backend=\${BACKEND_TYPE:-unknown}"
EOF

    log_success "Docker Compose file created"
}

# Build and start container
build_and_start() {
    local deploy_dir=$1
    local site_name=$2
    local port=$3
    
    # Save current directory
    local current_dir=$(pwd)
    
    # Get absolute path of deployment directory
    local abs_deploy_dir=$(cd "$deploy_dir" 2>/dev/null && pwd)
    
    if [ -z "$abs_deploy_dir" ]; then
        log_error "Deployment directory does not exist: $deploy_dir"
        return 1
    fi
    
    # Change to deployment directory
    cd "$abs_deploy_dir"
    
    log_info "Working in directory: $(pwd)"
    log_info "Checking for Dockerfile..."
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found in $(pwd)"
        log_info "Contents of directory:"
        ls -la | head -10
        cd "$current_dir"
        return 1
    else
        log_success "Dockerfile found"
    fi
    
    log_step "Building Docker image..."
    if docker compose build --no-cache; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        cd "$current_dir"
        return 1
    fi
    
    log_step "Starting container..."
    if docker compose up -d; then
        log_success "Container started successfully"
        log_info "🌐 Your site is now running at: http://localhost:$port"
    else
        log_error "Failed to start container"
        cd "$current_dir"
        return 1
    fi
    
    # Return to original directory
    cd "$current_dir"
    
    return 0
}

# Test backend connection
test_backend_connection() {
    local backend_type=$1
    local url=$2
    local key=$3
    
    log_step "Testing $backend_type connection..."
    
    case $backend_type in
        "supabase")
            # Test Supabase connection
            local test_url="$url/rest/v1/"
            response=$(curl -s -H "apikey: $key" -H "Authorization: Bearer $key" "$test_url" -w "%{http_code}" -o /dev/null)
            ;;
        "cloudbox")
            # Test Cloudbox connection - try different endpoints
            local test_url="$url/health"
            response=$(curl -s -H "Authorization: Bearer $key" "$test_url" -w "%{http_code}" -o /dev/null)
            
            # If health endpoint fails, try root API endpoint
            if [ "$response" -ne 200 ] && [ "$response" -ne 401 ]; then
                test_url="$url/api"
                response=$(curl -s -H "Authorization: Bearer $key" "$test_url" -w "%{http_code}" -o /dev/null)
            fi
            
            # If that fails too, try just the base URL
            if [ "$response" -ne 200 ] && [ "$response" -ne 401 ]; then
                test_url="$url"
                response=$(curl -s "$test_url" -w "%{http_code}" -o /dev/null)
            fi
            ;;
        *)
            log_error "Unknown backend type: $backend_type"
            return 1
            ;;
    esac
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 401 ]; then
        log_success "$backend_type connection test passed"
        return 0
    else
        log_error "$backend_type connection test failed (HTTP $response)"
        return 1
    fi
}

# Cleanup on failure
cleanup_on_failure() {
    local deploy_dir=$1
    local site_name=$2
    
    log_warning "Cleaning up failed deployment..."
    
    # Stop and remove container if it exists
    if docker ps -a --format "table {{.Names}}" | grep -q "^$site_name$"; then
        docker stop "$site_name" >/dev/null 2>&1
        docker rm "$site_name" >/dev/null 2>&1
    fi
    
    # Remove deployment directory
    if [ -d "$deploy_dir" ]; then
        rm -rf "$deploy_dir"
    fi
    
    log_info "Cleanup completed"
}

# Show deployment summary
show_deployment_summary() {
    local site_name=$1
    local port=$2
    local backend_type=$3
    local backend_url=$4
    local deploy_dir=$5
    
    echo ""
    log_success "Deployment complete!"
    echo "===================="
    echo "📱 Site Name: $site_name"
    echo "🌐 URL: http://localhost:$port"
    echo "🔧 Backend: $backend_type"
    echo "🔗 Backend URL: $backend_url"
    echo "📁 Files: $deploy_dir"
    echo ""
    echo "Management commands:"
    echo "  • Stop: cd $deploy_dir && docker-compose down"
    echo "  • Restart: cd $deploy_dir && docker-compose restart"
    echo "  • Logs: cd $deploy_dir && docker-compose logs -f"
    echo "  • Update: ./manage-deployments.sh update $site_name"
    echo ""
}