#!/bin/bash

# Standalone Cloudbox backend setup script
# Run this after deployment to create database and API routes

source "$(dirname "$0")/shared-functions.sh"

setup_cloudbox_backend() {
    local site_name=$1
    local cloudbox_url=$2
    local cloudbox_api_key=$3
    local cloudbox_project_id=$4
    
    log_info "🔧 Setting up Cloudbox backend for: $site_name"
    log_info "🔗 Cloudbox URL: $cloudbox_url"
    
    # Validation
    if [ -z "$site_name" ] || [ -z "$cloudbox_url" ] || [ -z "$cloudbox_api_key" ] || [ -z "$cloudbox_project_id" ]; then
        log_error "Missing required parameters"
        echo "Usage: $0 <site_name> <cloudbox_url> <cloudbox_api_key> <cloudbox_project_id>"
        echo ""
        echo "Example:"
        echo "  $0 client2 https://api.cloudbox.com your-api-key your-project-id"
        return 1
    fi
    
    # Test connection
    test_backend_connection "cloudbox" "$cloudbox_url" "$cloudbox_api_key" || return 1
    
    # Create database in Cloudbox
    create_cloudbox_database "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id" || return 1
    
    # Create API routes in Cloudbox
    create_cloudbox_api_routes "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id" || return 1
    
    log_success "✅ Cloudbox backend setup completed successfully!"
    log_info "Database and API routes are now available for: $site_name"
    
    return 0
}

create_cloudbox_database() {
    local cloudbox_url=$1
    local cloudbox_api_key=$2
    local cloudbox_project_id=$3
    
    log_step "Creating Cloudbox database..."
    
    # Use correct Cloudbox API endpoint structure
    local api_base="$cloudbox_url/p/$cloudbox_project_id/api"
    
    # Create database via Cloudbox API
    local response=$(curl -s -X POST "$api_base/database" \
        -H "Authorization: Bearer $cloudbox_api_key" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "portfolio_db",
            "tables": [
                {
                    "name": "site_settings",
                    "columns": [
                        {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
                        {"name": "site_title", "type": "text", "default": "Portfolio"},
                        {"name": "site_tagline", "type": "text", "default": ""},
                        {"name": "logo_url", "type": "text"},
                        {"name": "primary_color", "type": "text", "default": "#2D3748"},
                        {"name": "secondary_color", "type": "text", "default": "#F7FAFC"},
                        {"name": "accent_color", "type": "text", "default": "#F6D55C"},
                        {"name": "created_at", "type": "timestamp", "default": "now()"},
                        {"name": "updated_at", "type": "timestamp", "default": "now()"}
                    ]
                },
                {
                    "name": "profiles",
                    "columns": [
                        {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
                        {"name": "user_id", "type": "uuid", "unique": true},
                        {"name": "email", "type": "text", "required": true},
                        {"name": "full_name", "type": "text"},
                        {"name": "role", "type": "text", "default": "editor"},
                        {"name": "created_at", "type": "timestamp", "default": "now()"},
                        {"name": "updated_at", "type": "timestamp", "default": "now()"}
                    ]
                },
                {
                    "name": "albums",
                    "columns": [
                        {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
                        {"name": "name", "type": "text", "required": true},
                        {"name": "slug", "type": "text", "required": true},
                        {"name": "description", "type": "text"},
                        {"name": "is_visible", "type": "boolean", "default": true},
                        {"name": "sort_order", "type": "integer", "default": 0},
                        {"name": "cover_photo_id", "type": "uuid"},
                        {"name": "show_title_in_slideshow", "type": "boolean", "default": true},
                        {"name": "show_description_in_slideshow", "type": "boolean", "default": true},
                        {"name": "created_at", "type": "timestamp", "default": "now()"},
                        {"name": "updated_at", "type": "timestamp", "default": "now()"}
                    ]
                },
                {
                    "name": "photos",
                    "columns": [
                        {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
                        {"name": "album_id", "type": "uuid"},
                        {"name": "filename", "type": "text", "required": true},
                        {"name": "file_url", "type": "text", "required": true},
                        {"name": "alt_text", "type": "text"},
                        {"name": "caption", "type": "text"},
                        {"name": "is_visible", "type": "boolean", "default": true},
                        {"name": "sort_order", "type": "integer", "default": 0},
                        {"name": "created_at", "type": "timestamp", "default": "now()"},
                        {"name": "updated_at", "type": "timestamp", "default": "now()"}
                    ]
                },
                {
                    "name": "languages",
                    "columns": [
                        {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
                        {"name": "code", "type": "text", "required": true},
                        {"name": "name", "type": "text", "required": true},
                        {"name": "is_enabled", "type": "boolean", "default": true},
                        {"name": "is_default", "type": "boolean", "default": false},
                        {"name": "created_at", "type": "timestamp", "default": "now()"},
                        {"name": "updated_at", "type": "timestamp", "default": "now()"}
                    ]
                },
                {
                    "name": "translations",
                    "columns": [
                        {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
                        {"name": "translation_key", "type": "text", "required": true},
                        {"name": "language_code", "type": "text", "required": true},
                        {"name": "translation_value", "type": "text", "required": true},
                        {"name": "table_name", "type": "text"},
                        {"name": "record_id", "type": "uuid"},
                        {"name": "field_name", "type": "text"},
                        {"name": "created_at", "type": "timestamp", "default": "now()"},
                        {"name": "updated_at", "type": "timestamp", "default": "now()"}
                    ]
                }
            ]
        }')
    
    # Check if database creation was successful
    if echo "$response" | grep -q '"success":true\|"status":"created"'; then
        log_success "Cloudbox database created successfully"
        return 0
    else
        log_error "Failed to create Cloudbox database"
        log_error "Response: $response"
        return 1
    fi
}

create_cloudbox_api_routes() {
    local cloudbox_url=$1
    local cloudbox_api_key=$2
    local cloudbox_project_id=$3
    
    log_step "Creating Cloudbox API routes..."
    
    # Use correct Cloudbox API endpoint structure
    local api_base="$cloudbox_url/p/$cloudbox_project_id/api"
    
    # Create API routes via Cloudbox API
    local response=$(curl -s -X POST "$api_base/routes" \
        -H "Authorization: Bearer $cloudbox_api_key" \
        -H "Content-Type: application/json" \
        -d '{
            "routes": [
                {
                    "path": "/api/site-settings",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "table": "site_settings",
                    "auth_required": false
                },
                {
                    "path": "/api/profiles",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "table": "profiles",
                    "auth_required": true
                },
                {
                    "path": "/api/albums",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "table": "albums",
                    "auth_required": false
                },
                {
                    "path": "/api/photos",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "table": "photos",
                    "auth_required": false
                },
                {
                    "path": "/api/languages",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "table": "languages",
                    "auth_required": false
                },
                {
                    "path": "/api/translations",
                    "methods": ["GET", "POST", "PUT", "DELETE"],
                    "table": "translations",
                    "auth_required": false
                },
                {
                    "path": "/auth/signin",
                    "methods": ["POST"],
                    "handler": "auth.signin"
                },
                {
                    "path": "/auth/signup",
                    "methods": ["POST"],
                    "handler": "auth.signup"
                },
                {
                    "path": "/auth/signout",
                    "methods": ["POST"],
                    "handler": "auth.signout"
                }
            ]
        }')
    
    # Check if API routes creation was successful
    if echo "$response" | grep -q '"success":true\|"status":"created"'; then
        log_success "Cloudbox API routes created successfully"
        return 0
    else
        log_error "Failed to create Cloudbox API routes"
        log_error "Response: $response"
        return 1
    fi
}

# Main execution
if [ "$#" -ne 4 ]; then
    log_error "❌ Invalid number of arguments"
    echo "Usage: $0 <site_name> <cloudbox_url> <cloudbox_api_key> <cloudbox_project_id>"
    echo ""
    echo "Example:"
    echo "  $0 client2 https://api.cloudbox.com your-api-key your-project-id"
    exit 1
fi

setup_cloudbox_backend "$@"