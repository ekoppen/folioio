#!/bin/bash

# Debug script to discover working Cloudbox API endpoints

source "$(dirname "$0")/shared-functions.sh"

debug_cloudbox_api() {
    local cloudbox_url=$1
    local cloudbox_api_key=$2
    local cloudbox_project_id=$3
    
    if [ -z "$cloudbox_url" ] || [ -z "$cloudbox_api_key" ] || [ -z "$cloudbox_project_id" ]; then
        echo "Usage: $0 <cloudbox_url> <cloudbox_api_key> <cloudbox_project_id>"
        echo "Example: $0 https://cloudbox.doorkoppen.nl your-api-key 42"
        exit 1
    fi
    
    log_info "🔍 Debugging Cloudbox API endpoints..."
    log_info "🔗 Base URL: $cloudbox_url"
    log_info "🆔 Project ID: $cloudbox_project_id"
    
    local api_base="$cloudbox_url/p/$cloudbox_project_id/api"
    
    # Test different endpoints and methods
    local endpoints=(
        "GET $api_base"
        "GET $api_base/"
        "GET $api_base/status"
        "GET $api_base/info"
        "GET $api_base/database"
        "GET $api_base/databases"
        "GET $api_base/tables"
        "GET $api_base/routes"
        "GET $api_base/endpoints"
        "POST $api_base/database"
        "PUT $api_base/database"
        "POST $api_base/databases"
        "POST $api_base/tables"
        "POST $api_base/routes"
    )
    
    log_info "Testing ${#endpoints[@]} different endpoints..."
    echo ""
    
    for endpoint_info in "${endpoints[@]}"; do
        local method=$(echo "$endpoint_info" | cut -d' ' -f1)
        local url=$(echo "$endpoint_info" | cut -d' ' -f2-)
        
        echo "🔎 Testing: $method $url"
        
        # Test different authentication methods
        local auth_methods=(
            "Authorization: Bearer $cloudbox_api_key"
            "X-API-Key: $cloudbox_api_key"
            "API-Key: $cloudbox_api_key"
            "X-Auth-Token: $cloudbox_api_key"
            "Token: $cloudbox_api_key"
        )
        
        local found_working_auth=false
        
        for auth_header in "${auth_methods[@]}"; do
            echo "    🔐 Auth method: $auth_header"
            
            local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$url" \
                -H "$auth_header" \
                -H "Content-Type: application/json" \
                -d '{"test": true}' 2>/dev/null)
        
            local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
            local response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
            
            if [ -z "$http_code" ]; then
                http_code="ERROR"
            fi
            
            case "$http_code" in
                200|201|202)
                    echo "        ✅ SUCCESS ($http_code): $response_body"
                    found_working_auth=true
                    break
                    ;;
                400|401|403)
                    echo "        ⚠️  CLIENT ERROR ($http_code): $response_body"
                    ;;
                404)
                    echo "        ❌ NOT FOUND ($http_code)"
                    ;;
                405)
                    echo "        ⚠️  METHOD NOT ALLOWED ($http_code)"
                    ;;
                500|502|503)
                    echo "        💥 SERVER ERROR ($http_code): $response_body"
                    ;;
                *)
                    echo "        ❓ UNKNOWN ($http_code): $response_body"
                    ;;
            esac
        done
        
        if [ "$found_working_auth" = false ]; then
            echo "    ❌ No working auth method found for this endpoint"
        fi
        echo ""
    done
    
    log_info "🔍 Testing root API endpoints..."
    
    local root_endpoints=(
        "GET $cloudbox_url/api"
        "GET $cloudbox_url/api/projects"
        "GET $cloudbox_url/api/projects/$cloudbox_project_id"
        "GET $cloudbox_url/api/health"
        "GET $cloudbox_url/health"
        "GET $cloudbox_url/status"
    )
    
    for endpoint_info in "${root_endpoints[@]}"; do
        local method=$(echo "$endpoint_info" | cut -d' ' -f1)
        local url=$(echo "$endpoint_info" | cut -d' ' -f2-)
        
        echo "🔎 Testing: $method $url"
        
        local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$url" \
            -H "Authorization: Bearer $cloudbox_api_key" \
            -H "Content-Type: application/json" 2>/dev/null)
        
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        
        if [ -z "$http_code" ]; then
            http_code="ERROR"
        fi
        
        case "$http_code" in
            200|201|202)
                echo "   ✅ SUCCESS ($http_code): $response_body"
                ;;
            400|401|403)
                echo "   ⚠️  CLIENT ERROR ($http_code): $response_body"
                ;;
            404)
                echo "   ❌ NOT FOUND ($http_code)"
                ;;
            405)
                echo "   ⚠️  METHOD NOT ALLOWED ($http_code)"
                ;;
            500|502|503)
                echo "   💥 SERVER ERROR ($http_code): $response_body"
                ;;
            *)
                echo "   ❓ UNKNOWN ($http_code): $response_body"
                ;;
        esac
        echo ""
    done
    
    log_success "API endpoint discovery completed!"
    log_info "Look for ✅ SUCCESS responses above to find working endpoints."
}

# Make executable and run
chmod +x "$0"

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <cloudbox_url> <cloudbox_api_key> <cloudbox_project_id>"
    echo "Example: $0 https://cloudbox.doorkoppen.nl your-api-key 42"
    exit 1
fi

debug_cloudbox_api "$@"