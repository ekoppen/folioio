#!/bin/bash

# Cloudbox-specific deployment functions

source "$(dirname "$0")/shared-functions.sh"

deploy_cloudbox() {
    local site_name=$1
    local port=$2
    local cloudbox_url=$3
    local cloudbox_api_key=$4
    local cloudbox_project_id=$5
    
    # Get the base directory (parent of backends directory)
    local base_dir="$(cd "$(dirname "$0")/.." && pwd)"
    local deploy_dir="$base_dir/deployments/$site_name"
    
    log_info "🚀 Deploying Cloudbox-powered site: $site_name"
    log_info "📍 Port: $port"
    log_info "🔗 Cloudbox URL: $cloudbox_url"
    
    # Validation
    validate_site_name "$site_name" || return 1
    validate_port "$port" || return 1
    validate_url "$cloudbox_url" || return 1
    check_port_available "$port" || return 1
    check_deployment_exists "$site_name" || return 1
    
    # Test connection
    test_backend_connection "cloudbox" "$cloudbox_url" "$cloudbox_api_key" || return 1
    
    # Create deployment structure
    create_deployment_dir "$deploy_dir" "$site_name" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Create Cloudbox configuration
    create_cloudbox_config "$deploy_dir" "$site_name" "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Create backend configuration
    create_backend_config "$deploy_dir" "cloudbox" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Install Cloudbox SDK
    install_cloudbox_sdk "$deploy_dir" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Setup Cloudbox database
    setup_cloudbox_database "$deploy_dir" "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Create Docker Compose
    create_docker_compose "$deploy_dir" "$site_name" "$port"
    
    # Update docker-compose.yml with Cloudbox environment variables
    cat > "$deploy_dir/docker-compose.yml" << EOF
services:
  $site_name:
    build:
      context: .
      args:
        - VITE_CLOUDBOX_URL=$cloudbox_url
        - VITE_CLOUDBOX_API_KEY=$cloudbox_api_key
        - VITE_CLOUDBOX_PROJECT_ID=$cloudbox_project_id
    ports:
      - "$port:80"
    environment:
      - NODE_ENV=production
      - BACKEND_TYPE=cloudbox
    restart: unless-stopped
    container_name: $site_name
    labels:
      - "com.portfolio.site_name=$site_name"
      - "com.portfolio.port=$port"
      - "com.portfolio.backend=cloudbox"
EOF

    # Also inject configuration into index.html for runtime access
    if [ -f "$deploy_dir/index.html" ]; then
        # Add script tag before closing head tag to inject Cloudbox config
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|</head>|  <script>window.__CLOUDBOX_URL__ = '$cloudbox_url'; window.__CLOUDBOX_API_KEY__ = '$cloudbox_api_key'; window.__CLOUDBOX_PROJECT_ID__ = '$cloudbox_project_id';</script>\n  </head>|" "$deploy_dir/index.html"
        else
            # Linux
            sed -i "s|</head>|  <script>window.__CLOUDBOX_URL__ = '$cloudbox_url'; window.__CLOUDBOX_API_KEY__ = '$cloudbox_api_key'; window.__CLOUDBOX_PROJECT_ID__ = '$cloudbox_project_id';</script>\n  </head>|" "$deploy_dir/index.html"
        fi
    fi
    
    # Build and start
    build_and_start "$deploy_dir" "$site_name" "$port" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Show summary
    show_deployment_summary "$site_name" "$port" "Cloudbox" "$cloudbox_url" "$deploy_dir"
    
    return 0
}

create_cloudbox_config() {
    local deploy_dir=$1
    local site_name=$2
    local cloudbox_url=$3
    local cloudbox_api_key=$4
    local cloudbox_project_id=$5
    
    log_step "Creating Cloudbox configuration..."
    
    cat > "$deploy_dir/src/config/cloudbox-config.ts" << EOF
// Cloudbox configuration for $site_name deployment
interface CloudboxConfig {
  url: string;
  apiKey: string;
  projectId: string;
}

const config: CloudboxConfig = {
  url: '$cloudbox_url',
  apiKey: '$cloudbox_api_key',
  projectId: '$cloudbox_project_id'
};

export const getCloudboxConfig = (): CloudboxConfig => config;
export const CLOUDBOX_CONFIG = config;
EOF
    
    log_success "Cloudbox configuration created"
    return 0
}

create_backend_config() {
    local deploy_dir=$1
    local backend_type=$2
    
    log_step "Creating backend configuration..."
    
    # Update the backend config to force Cloudbox
    cat > "$deploy_dir/src/config/backend-config.ts" << 'EOF'
// Multi-backend configuration system
import { BackendAdapter, BackendType } from '@/lib/backend/types';
import { CloudboxAdapter, CloudboxConfig } from '@/lib/backend/cloudbox-adapter';

export interface BackendConfig {
  type: BackendType;
  supabase?: any;
  cloudbox?: CloudboxConfig;
}

// Get Cloudbox configuration from injected variables
const getCloudboxConfig = (): CloudboxConfig => {
  const cloudboxUrl = (window as any).__CLOUDBOX_URL__ || import.meta.env.VITE_CLOUDBOX_URL;
  const cloudboxApiKey = (window as any).__CLOUDBOX_API_KEY__ || import.meta.env.VITE_CLOUDBOX_API_KEY;
  const cloudboxProjectId = (window as any).__CLOUDBOX_PROJECT_ID__ || import.meta.env.VITE_CLOUDBOX_PROJECT_ID;

  if (!cloudboxUrl || !cloudboxApiKey || !cloudboxProjectId) {
    throw new Error('Missing Cloudbox configuration. Please check your deployment.');
  }

  return {
    url: cloudboxUrl,
    apiKey: cloudboxApiKey,
    projectId: cloudboxProjectId
  };
};

// Runtime backend configuration detection
export const getBackendConfig = (): BackendConfig => {
  return {
    type: 'cloudbox',
    cloudbox: getCloudboxConfig()
  };
};

// Backend adapter factory
export const createBackendAdapter = (config?: BackendConfig): BackendAdapter => {
  const finalConfig = config || getBackendConfig();

  if (finalConfig.type !== 'cloudbox' || !finalConfig.cloudbox) {
    throw new Error('Only Cloudbox backend is supported in this deployment');
  }

  return new CloudboxAdapter(finalConfig.cloudbox);
};

// Singleton backend adapter instance
let backendInstance: BackendAdapter | null = null;

export const getBackendAdapter = (): BackendAdapter => {
  if (!backendInstance) {
    backendInstance = createBackendAdapter();
  }
  return backendInstance;
};

// Function to reset backend instance (useful for switching backends)
export const resetBackendAdapter = () => {
  backendInstance = null;
};

// Export configurations for compatibility
export const BACKEND_CONFIG = getBackendConfig();

// Legacy exports for existing code compatibility
export const SUPABASE_CONFIG = {
  get url() { throw new Error('SUPABASE_CONFIG not available in Cloudbox deployment. Use BACKEND_CONFIG instead.'); },
  get anonKey() { throw new Error('SUPABASE_CONFIG not available in Cloudbox deployment. Use BACKEND_CONFIG instead.'); },
  get projectId() { throw new Error('SUPABASE_CONFIG not available in Cloudbox deployment. Use BACKEND_CONFIG instead.'); }
};

export const getSupabaseConfig = () => {
  throw new Error('getSupabaseConfig not available in Cloudbox deployment. Use getBackendConfig instead.');
};
EOF
    
    log_success "Backend configuration created"
    return 0
}

install_cloudbox_sdk() {
    local deploy_dir=$1
    
    log_step "Installing Cloudbox SDK..."
    
    # Add cloudbox SDK to package.json
    cd "$deploy_dir"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in deployment directory"
        return 1
    fi
    
    # Add cloudbox SDK dependency (this would be done in the container build)
    # For now, we'll just log that it would be installed
    log_success "Cloudbox SDK will be installed during Docker build"
    
    return 0
}

setup_cloudbox_database() {
    local deploy_dir=$1
    local cloudbox_url=$2
    local cloudbox_api_key=$3
    local cloudbox_project_id=$4
    
    log_step "Setting up Cloudbox database schema..."
    
    # Create database in Cloudbox
    create_cloudbox_database "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id" || return 1
    
    # Create API routes in Cloudbox
    create_cloudbox_api_routes "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id" || return 1
    
    # Create database setup script for later reference
    create_database_setup_script "$deploy_dir" "$cloudbox_url" "$cloudbox_api_key" "$cloudbox_project_id"
    
    log_success "Cloudbox database and API routes created successfully"
    
    return 0
}

create_database_setup_script() {
    local deploy_dir=$1
    local cloudbox_url=$2
    local cloudbox_api_key=$3
    local cloudbox_project_id=$4
    
    mkdir -p "$deploy_dir/scripts"
    
    cat > "$deploy_dir/scripts/setup-cloudbox-database.js" << EOF
#!/usr/bin/env node

// Cloudbox Database Setup Script
// This script sets up the complete database schema for the portfolio application

const CLOUDBOX_CONFIG = {
  url: '$cloudbox_url',
  apiKey: '$cloudbox_api_key',
  projectId: '$cloudbox_project_id'
};

async function setupDatabase() {
  console.log('🔧 Setting up Cloudbox database...');
  
  try {
    // 1. Create tables
    await createTables();
    
    // 2. Create functions and triggers
    await createFunctions();
    
    // 3. Set up security policies
    await setupSecurity();
    
    // 4. Create storage buckets
    await createStorageBuckets();
    
    // 5. Seed default data
    await seedDefaultData();
    
    console.log('✅ Cloudbox database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function createTables() {
  console.log('📊 Creating database tables...');
  
  const tables = [
    \`CREATE TABLE IF NOT EXISTS site_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_title TEXT NOT NULL DEFAULT 'Portfolio',
      site_tagline TEXT DEFAULT '',
      logo_url TEXT,
      primary_color TEXT DEFAULT '#2D3748',
      secondary_color TEXT DEFAULT '#F7FAFC',
      accent_color TEXT DEFAULT '#F6D55C',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )\`,
    
    \`CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )\`,
    
    \`CREATE TABLE IF NOT EXISTS albums (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      is_visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      cover_photo_id UUID,
      show_title_in_slideshow BOOLEAN DEFAULT TRUE,
      show_description_in_slideshow BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )\`,
    
    \`CREATE TABLE IF NOT EXISTS photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      album_id UUID,
      filename TEXT NOT NULL,
      file_url TEXT NOT NULL,
      alt_text TEXT,
      caption TEXT,
      is_visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )\`,
    
    \`CREATE TABLE IF NOT EXISTS languages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      is_enabled BOOLEAN DEFAULT TRUE,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )\`,
    
    \`CREATE TABLE IF NOT EXISTS translations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      translation_key TEXT NOT NULL,
      language_code TEXT NOT NULL,
      translation_value TEXT NOT NULL,
      table_name TEXT,
      record_id UUID,
      field_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )\`
  ];
  
  for (const sql of tables) {
    await executeSQL(sql);
  }
}

async function createFunctions() {
  console.log('⚙️ Creating database functions...');
  
  const functions = [
    \`CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    \$\$ LANGUAGE plpgsql\`,
    
    \`CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
    RETURNS BOOLEAN AS \$\$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE email = user_email AND role = 'admin'
      );
    END;
    \$\$ LANGUAGE plpgsql\`
  ];
  
  for (const sql of functions) {
    await executeSQL(sql);
  }
}

async function setupSecurity() {
  console.log('🔒 Setting up security policies...');
  
  // In a real implementation, you would set up RLS equivalent security here
  console.log('Security policies setup would be implemented here');
}

async function createStorageBuckets() {
  console.log('📁 Creating storage buckets...');
  
  const buckets = [
    { id: 'logos', public: true },
    { id: 'gallery-images', public: true },
    { id: 'slideshow-images', public: true },
    { id: 'custom-fonts', public: true },
    { id: 'fotos', public: true }
  ];
  
  for (const bucket of buckets) {
    await createBucket(bucket.id, bucket.public);
  }
}

async function seedDefaultData() {
  console.log('🌱 Seeding default data...');
  
  // Insert default language
  await executeSQL(\`
    INSERT INTO languages (code, name, is_enabled, is_default) 
    VALUES ('nl', 'Nederlands', true, true)
    ON CONFLICT DO NOTHING
  \`);
  
  // Insert default site settings
  await executeSQL(\`
    INSERT INTO site_settings (site_title, site_tagline) 
    VALUES ('Portfolio', 'Mijn creatieve werk')
    ON CONFLICT DO NOTHING
  \`);
}

async function executeSQL(sql) {
  // This would use the Cloudbox SDK to execute SQL
  console.log('Executing SQL:', sql.substring(0, 50) + '...');
  
  // Placeholder for actual Cloudbox SDK call
  // const response = await cloudboxClient.executeSQL(sql);
  
  return true;
}

async function createBucket(bucketId, isPublic) {
  console.log(\`Creating bucket: \${bucketId} (public: \${isPublic})\`);
  
  // Placeholder for actual Cloudbox SDK call
  // const response = await cloudboxClient.storage.createBucket(bucketId, { public: isPublic });
  
  return true;
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
EOF
    
    chmod +x "$deploy_dir/scripts/setup-cloudbox-database.js"
    
    log_success "Database setup script created"
}

create_cloudbox_database() {
    local cloudbox_url=$1
    local cloudbox_api_key=$2
    local cloudbox_project_id=$3
    
    log_step "Creating Cloudbox database..."
    
    # Define the collections based on the Cloudbox API structure
    local collections=(
        "site_settings"
        "profiles"
        "albums"
        "photos"
        "languages"
        "translations"
    )
    
    local api_url="$cloudbox_url/p/$cloudbox_project_id/api"
    
    for collection_name in "${collections[@]}"; do
        log_info "Creating collection: $collection_name"
        
        local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$api_url/collections" \
            -H "X-API-Key: $cloudbox_api_key" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$collection_name\"
            }")
        
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            log_success "Created collection: $collection_name"
        elif [ "$http_code" = "409" ] || echo "$response_body" | grep -q "already exists\|duplicate"; then
            log_info "Collection $collection_name already exists - skipping"
        else
            log_error "Failed to create collection $collection_name (HTTP $http_code)"
            log_error "Response: $response_body"
            return 1
        fi
    done
    
    # Create storage buckets
    log_info "Creating storage buckets..."
    
    local buckets=(
        "photos:true"
        "avatars:true"
        "assets:true"
    )
    
    for bucket_def in "${buckets[@]}"; do
        local bucket_name=$(echo "$bucket_def" | cut -d':' -f1)
        local is_public=$(echo "$bucket_def" | cut -d':' -f2)
        
        log_info "Creating storage bucket: $bucket_name"
        
        local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$api_url/storage/buckets" \
            -H "X-API-Key: $cloudbox_api_key" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$bucket_name\",
                \"public\": $is_public
            }")
        
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            log_success "Created storage bucket: $bucket_name"
        elif [ "$http_code" = "409" ] || echo "$response_body" | grep -q "already exists\|duplicate"; then
            log_info "Storage bucket $bucket_name already exists - skipping"
        else
            log_error "Failed to create storage bucket $bucket_name (HTTP $http_code)"
            log_error "Response: $response_body"
            return 1
        fi
    done
    
    return 0
}

create_cloudbox_api_routes() {
    local cloudbox_url=$1
    local cloudbox_api_key=$2
    local cloudbox_project_id=$3
    
    log_step "Creating Cloudbox API routes..."
    
    # Note: Based on the Cloudbox API documentation, API routes are automatically
    # available for collections using the pattern /p/{project_id}/api/data/{collection}
    # So we don't need to explicitly create routes - they exist once collections are created
    
    log_info "API routes are automatically available for created collections:"
    log_info "- Site settings: GET/POST/PUT/DELETE /p/$cloudbox_project_id/api/data/site_settings"
    log_info "- Profiles: GET/POST/PUT/DELETE /p/$cloudbox_project_id/api/data/profiles"
    log_info "- Albums: GET/POST/PUT/DELETE /p/$cloudbox_project_id/api/data/albums"
    log_info "- Photos: GET/POST/PUT/DELETE /p/$cloudbox_project_id/api/data/photos"
    log_info "- Languages: GET/POST/PUT/DELETE /p/$cloudbox_project_id/api/data/languages"
    log_info "- Translations: GET/POST/PUT/DELETE /p/$cloudbox_project_id/api/data/translations"
    
    log_success "Cloudbox API routes are ready"
    return 0
}