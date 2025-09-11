#!/bin/bash

# Convert domain name to directory-safe name
get_safe_dir_name() {
    local name=$1
    # Replace dots and other special characters with underscores
    echo "$name" | sed 's/[^a-zA-Z0-9-]/_/g'
}

# Local Docker deployment with PostgreSQL + Minio
# Usage: deploy_local <site-name> <frontend-port> <backend-url> <api-key> <project-id>

deploy_local() {
    local site_name=$1
    local frontend_port=$2
    local backend_url=$3  # Not used for local, but kept for compatibility
    local api_key=$4      # Not used for local, but kept for compatibility
    local project_id=$5   # Not used for local, but kept for compatibility
    
    log_step "Starting local Docker deployment for '$site_name'"
    
    # Get a directory-safe version of the site name
    local safe_site_name=$(get_safe_dir_name "$site_name")
    
    # Calculate ports based on frontend port
    local api_port=$((frontend_port + 139))     # 3001 -> 3140 (matches Docker default)
    local db_port=$((frontend_port + 1000))     # 3001 -> 4001
    local storage_port=$((frontend_port + 2000)) # 3001 -> 5001
    local storage_console_port=$((storage_port + 1)) # 5001 -> 5002
    
    log_info "Port configuration:"
    log_info "  Frontend: $frontend_port"
    log_info "  API: $api_port"
    log_info "  Database: $db_port"
    log_info "  Storage: $storage_port"
    log_info "  Storage Console: $storage_console_port"
    
    # Create deployment directory using safe name
    local deploy_dir="deployments/$safe_site_name"
    
    # Clean up existing deployment if it exists
    if [ -d "$deploy_dir" ]; then
        log_info "Cleaning up existing deployment..."
        cd "$deploy_dir" && docker compose down -v > /dev/null 2>&1 && cd - > /dev/null 2>&1
    fi
    
    create_deployment_dir "$deploy_dir" "$safe_site_name"
    
    # Copy local backend files
    log_info "Copying local backend files..."
    cp -r local-backend "$deploy_dir/"
    
    # Copy local docker compose template
    cp docker-compose.local.yml "$deploy_dir/docker-compose.yml"
    
    # Create postgres config directory
    mkdir -p "$deploy_dir/postgres-config"
    
    # Copy database initialization if it exists
    if [ -f "local-backend/src/migrations/001_init_schema.sql" ]; then
        cp local-backend/src/migrations/001_init_schema.sql "$deploy_dir/postgres-config/"
    fi
    
    # Generate secure credentials
    local database_password=$(generate_random_password)
    local jwt_secret=$(generate_random_password 64)
    local minio_access_key="admin$(generate_random_password 8)"
    local minio_secret_key=$(generate_random_password 32)
    
    # Create environment configuration (pass both original and safe names)
    create_local_env_file "$deploy_dir" "$site_name" "$safe_site_name" "$frontend_port" "$api_port" "$db_port" "$storage_port" "$storage_console_port" "$database_password" "$jwt_secret" "$minio_access_key" "$minio_secret_key"
    
    # Check port availability
    check_port_available "$frontend_port" || {
        log_error "Port $frontend_port is already in use"
        cleanup_on_failure "$deploy_dir" "$safe_site_name"
        return 1
    }
    
    check_port_available "$api_port" || {
        log_error "Port $api_port is already in use"
        cleanup_on_failure "$deploy_dir" "$safe_site_name"
        return 1
    }
    
    check_port_available "$db_port" || {
        log_error "Port $db_port is already in use"
        cleanup_on_failure "$deploy_dir" "$safe_site_name"
        return 1
    }
    
    check_port_available "$storage_port" || {
        log_error "Port $storage_port is already in use"
        cleanup_on_failure "$deploy_dir" "$safe_site_name"
        return 1
    }
    
    # Build and start services
    log_step "Building and starting local backend services..."
    cd "$deploy_dir"
    
    # Load environment variables from .env file
    source .env
    
    # Build services with explicit build args
    log_info "Building Docker images..."
    log_info "Using API URL: $API_EXTERNAL_URL"
    docker compose --env-file .env build \
        --build-arg VITE_LOCAL_API_URL="$API_EXTERNAL_URL" \
        --build-arg VITE_BACKEND_TYPE="local" || {
        log_error "Failed to build Docker images"
        cd - > /dev/null
        cleanup_on_failure "$deploy_dir" "$safe_site_name"
        return 1
    }
    
    # Start services
    log_info "Starting services..."
    docker compose --env-file .env up -d || {
        log_error "Failed to start services"
        cd - > /dev/null
        cleanup_on_failure "$deploy_dir" "$safe_site_name"
        return 1
    }
    
    cd - > /dev/null
    
    # Wait for services to be ready
    log_step "Waiting for services to be ready..."
    
    # Wait for database
    wait_for_service "Database" "localhost:$db_port" 60
    
    # Wait for API server
    wait_for_service "API Server" "localhost:$api_port/health" 60
    
    # Wait for Minio
    wait_for_service "Storage" "localhost:$storage_port/minio/health/live" 30
    
    # Initialize storage buckets
    log_step "Initializing storage buckets..."
    initialize_storage_buckets "$safe_site_name" "$storage_port" "$minio_access_key" "$minio_secret_key"
    
    # Create default admin user
    log_step "Creating default admin user..."
    create_default_admin_user "$safe_site_name" "$api_port" "$db_port" "$database_password"
    
    # Show deployment summary (use original name for display)
    show_local_deployment_summary "$site_name" "$safe_site_name" "$frontend_port" "$api_port" "$db_port" "$storage_port" "$storage_console_port" "$deploy_dir" "$minio_access_key" "$minio_secret_key"
    
    log_success "Local deployment completed successfully!"
    return 0
}

# Get server's external address or use provided domain
get_server_address() {
    local site_name=$1
    
    # Check if site_name looks like a domain (contains dots)
    if [[ "$site_name" == *.* ]]; then
        # It's a domain name, use it as the server address
        # Log to stderr so it doesn't get captured in command substitution
        log_info "Using domain name as server address: $site_name" >&2
        echo "$site_name"
        return
    fi
    
    # Otherwise, detect the server IP address
    local server_ip=""
    
    # Try different methods to get the external IP
    if command -v hostname >/dev/null 2>&1; then
        # Try hostname -I (works on most Linux systems)
        server_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # If that didn't work, try ip command
    if [ -z "$server_ip" ] && command -v ip >/dev/null 2>&1; then
        server_ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
    fi
    
    # If still no IP, try ifconfig
    if [ -z "$server_ip" ] && command -v ifconfig >/dev/null 2>&1; then
        server_ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    fi
    
    # If we still don't have an IP, use localhost as fallback
    if [ -z "$server_ip" ]; then
        # Log to stderr so it doesn't get captured in command substitution
        log_warning "Could not detect server IP address, using localhost" >&2
        server_ip="localhost"
    fi
    
    echo "$server_ip"
}

# Create environment file for local deployment
create_local_env_file() {
    local deploy_dir=$1
    local site_name=$2  # Original name (might be domain)
    local safe_site_name=$3  # Safe name for containers
    local frontend_port=$4
    local api_port=$5
    local db_port=$6
    local storage_port=$7
    local storage_console_port=$8
    local database_password=$9
    local jwt_secret=${10}
    local minio_access_key=${11}
    local minio_secret_key=${12}
    
    # Get the server's external address (use site name if it's a domain)
    local server_address=$(get_server_address "$site_name")
    log_info "Server address: $server_address"
    
    # Determine API URL based on whether we have a domain
    local api_url_setting=""
    local api_domain=""
    if [[ "$site_name" == *.* ]]; then
        # It's a domain - create an API subdomain
        # Convert www.domain.com to api.domain.com
        # or domain.com to api.domain.com
        if [[ "$site_name" == www.* ]]; then
            # Replace www. with api.
            api_domain="${site_name/www./api.}"
        else
            # Prepend api. to the domain
            api_domain="api.$site_name"
        fi
        api_url_setting="https://$api_domain"
        log_info "Using API subdomain: $api_domain"
    else
        # For non-domains, use direct URL with port
        api_url_setting="http://$server_address:$api_port"
        log_info "Using direct API URL: $api_url_setting"
    fi
    
    cat > "$deploy_dir/.env" << EOF
# Local Portfolio Deployment Configuration
# Generated on $(date)

# Site Configuration
SITE_NAME=$site_name
CONTAINER_NAME=$safe_site_name-app
API_CONTAINER_NAME=$safe_site_name-api
DB_CONTAINER_NAME=$safe_site_name-db
STORAGE_CONTAINER_NAME=$safe_site_name-storage
NETWORK_NAME=$safe_site_name-network
VOLUME_PREFIX=$safe_site_name

# Server Configuration
SERVER_ADDRESS=$server_address

# Port Configuration
FRONTEND_PORT=$frontend_port
API_PORT=$api_port
DB_PORT=$db_port
STORAGE_PORT=$storage_port
STORAGE_CONSOLE_PORT=$storage_console_port

# Database Configuration
DATABASE_NAME=portfolio_db
DATABASE_USER=portfolio
DATABASE_PASSWORD=$database_password

# Minio Storage Configuration
MINIO_ACCESS_KEY=$minio_access_key
MINIO_SECRET_KEY=$minio_secret_key
STORAGE_EXTERNAL_URL=$server_address:$storage_port

# API Configuration
JWT_SECRET=$jwt_secret
API_EXTERNAL_URL=$api_url_setting

# Development Settings
NODE_ENV=production
EOF
    
    log_success "Environment configuration created"
}

# Generate random password (alphanumeric only for compatibility)
generate_random_password() {
    local length=${1:-32}
    # Use openssl for better compatibility across platforms
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
}

# Wait for service to be ready
wait_for_service() {
    local service_name=$1
    local endpoint=$2
    local timeout=$3
    local count=0
    
    log_info "Waiting for $service_name to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -f -s "http://$endpoint" > /dev/null 2>&1 || nc -z localhost ${endpoint#*:} 2>/dev/null; then
            log_success "$service_name is ready"
            return 0
        fi
        
        sleep 2
        count=$((count + 2))
        echo -n "."
    done
    
    echo
    log_warning "$service_name is not responding after ${timeout}s, but continuing..."
    return 1
}

# Initialize storage buckets
initialize_storage_buckets() {
    local site_name=$1
    local storage_port=$2
    local access_key=$3
    local secret_key=$4
    
    # Install minio client if not available
    if ! command -v mc > /dev/null; then
        log_info "Installing Minio client..."
        curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
        chmod +x /tmp/mc
        MC_CMD="/tmp/mc"
    else
        MC_CMD="mc"
    fi
    
    # Configure minio client
    $MC_CMD alias set local http://localhost:$storage_port $access_key $secret_key > /dev/null 2>&1
    
    # Create buckets
    local buckets=("gallery-images" "slideshow-images" "logos" "custom-fonts" "fotos")
    
    for bucket in "${buckets[@]}"; do
        if $MC_CMD mb local/$bucket > /dev/null 2>&1; then
            log_info "Created bucket: $bucket"
            # Set public policy for public buckets
            if [[ "$bucket" == "gallery-images" || "$bucket" == "slideshow-images" || "$bucket" == "logos" || "$bucket" == "fotos" ]]; then
                $MC_CMD policy set public local/$bucket > /dev/null 2>&1
            fi
        else
            log_info "Bucket $bucket already exists or failed to create"
        fi
    done
    
    # Clean up temporary mc if we installed it
    [ "$MC_CMD" = "/tmp/mc" ] && rm -f /tmp/mc
}

# Create default admin user
create_default_admin_user() {
    local site_name=$1
    local api_port=$2
    local db_port=$3
    local db_password=$4
    
    local admin_email="admin@${site_name}.local"
    local admin_password="admin123"
    local api_url="http://localhost:$api_port"
    
    log_info "Creating default admin user: $admin_email"
    log_info "Default password: $admin_password"
    
    # Create admin user via API with retry logic
    local user_created=false
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        log_info "Creating admin user (attempt $((retry_count + 1))/$max_retries)..."
        
        if curl -s -X POST "$api_url/auth/signup" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$admin_email\",\"password\":\"$admin_password\",\"full_name\":\"Site Administrator\"}" \
            > /dev/null 2>&1; then
            user_created=true
            break
        fi
        
        retry_count=$((retry_count + 1))
        sleep 3
    done
    
    if [ "$user_created" = true ]; then
        # Promote to admin via database with retry logic
        log_info "Promoting user to admin..."
        
        # Wait longer for user to be properly created and database to be ready
        sleep 5
        
        local promotion_success=false
        retry_count=0
        
        while [ $retry_count -lt $max_retries ]; do
            if docker exec "${site_name}-db" psql -U portfolio -d portfolio_db -c \
                "SELECT promote_to_admin('$admin_email');" > /dev/null 2>&1; then
                promotion_success=true
                break
            fi
            
            retry_count=$((retry_count + 1))
            log_info "Retrying admin promotion (attempt $((retry_count + 1))/$max_retries)..."
            sleep 3
        done
        
        if [ "$promotion_success" = true ]; then
            log_success "Default admin user created and promoted successfully!"
            log_info "Login credentials:"
            log_info "  Email: $admin_email"
            log_info "  Password: $admin_password"
        else
            log_warning "User created but failed to promote to admin after $max_retries attempts."
            log_info "You can promote manually with:"
            log_info "  docker exec ${site_name}-db psql -U portfolio -d portfolio_db -c \"SELECT promote_to_admin('$admin_email');\""
        fi
    else
        log_warning "Failed to create default admin user after $max_retries attempts."
        log_info "You can create one manually via the API or database."
    fi
}

# Show deployment summary for local backend
show_local_deployment_summary() {
    local site_name=$1  # Original name for display
    local safe_site_name=$2  # Safe name for commands
    local frontend_port=$3
    local api_port=$4
    local db_port=$5
    local storage_port=$6
    local storage_console_port=$7
    local deploy_dir=$8
    local minio_access_key=$9
    local minio_secret_key=${10}
    
    echo
    echo "${COLOR_GREEN}╔══════════════════════════════════════════════════════════════╗${COLOR_NC}"
    echo "${COLOR_GREEN}║                    DEPLOYMENT SUCCESSFUL                     ║${COLOR_NC}"
    echo "${COLOR_GREEN}╚══════════════════════════════════════════════════════════════╝${COLOR_NC}"
    echo
    # Get the server address for displaying URLs
    local server_address=$(get_server_address "$site_name")
    
    echo "${COLOR_BLUE}Site Name:${COLOR_NC} $site_name"
    echo "${COLOR_BLUE}Backend Type:${COLOR_NC} Local (PostgreSQL + Minio)"
    echo
    echo "${COLOR_YELLOW}🌐 Application URLs:${COLOR_NC}"
    echo "   Frontend:        ${COLOR_GREEN}http://$server_address:$frontend_port${COLOR_NC}"
    echo "   API Server:      ${COLOR_GREEN}http://$server_address:$api_port${COLOR_NC}"
    echo "   Storage Console: ${COLOR_GREEN}http://$server_address:$storage_console_port${COLOR_NC}"
    echo
    echo "${COLOR_YELLOW}🔌 Service Ports:${COLOR_NC}"
    echo "   PostgreSQL:      ${COLOR_GREEN}localhost:$db_port${COLOR_NC}"
    echo "   Minio S3:        ${COLOR_GREEN}localhost:$storage_port${COLOR_NC}"
    echo
    echo "${COLOR_YELLOW}🔐 Access Credentials:${COLOR_NC}"
    echo "   Admin Login:     ${COLOR_GREEN}admin@$site_name.local${COLOR_NC} / ${COLOR_GREEN}admin123${COLOR_NC}"
    echo "   Storage Console: ${COLOR_GREEN}$minio_access_key${COLOR_NC} / ${COLOR_GREEN}$minio_secret_key${COLOR_NC}"
    echo "   Database:        ${COLOR_GREEN}portfolio${COLOR_NC} / ${COLOR_GREEN}[password in .env]${COLOR_NC}"
    echo
    echo "${COLOR_YELLOW}📁 Deployment Directory:${COLOR_NC} $deploy_dir"
    echo
    echo "${COLOR_YELLOW}🛠️  Management Commands:${COLOR_NC}"
    echo "   ${COLOR_GREEN}./manage-deployments.sh logs $safe_site_name${COLOR_NC}       - View logs"
    echo "   ${COLOR_GREEN}./manage-deployments.sh restart $safe_site_name${COLOR_NC}    - Restart services"
    echo "   ${COLOR_GREEN}./manage-deployments.sh stop $safe_site_name${COLOR_NC}       - Stop services"
    echo "   ${COLOR_GREEN}./manage-deployments.sh start $safe_site_name${COLOR_NC}      - Start services"
    echo "   ${COLOR_GREEN}./manage-deployments.sh remove $safe_site_name${COLOR_NC}     - Remove deployment"
    echo
    echo "${COLOR_YELLOW}📊 Health Check:${COLOR_NC}"
    echo "   ${COLOR_GREEN}curl http://localhost:$api_port/health${COLOR_NC}"
    echo
    echo "${COLOR_BLUE}💡 This deployment includes:${COLOR_NC}"
    echo "   ✅ PostgreSQL database with full schema"
    echo "   ✅ Minio S3-compatible object storage"
    echo "   ✅ Custom API server with JWT authentication"
    echo "   ✅ Automatic database initialization"
    echo "   ✅ Pre-configured storage buckets"
    echo "   ✅ Complete offline operation"
    echo
}