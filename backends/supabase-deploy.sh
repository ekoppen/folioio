#!/bin/bash

# Supabase-specific deployment functions

source "$(dirname "$0")/shared-functions.sh"

deploy_supabase() {
    local site_name=$1
    local port=$2
    local supabase_url=$3
    local supabase_anon_key=$4
    local supabase_project_id=$5
    
    # Get the base directory (parent of backends directory)
    local base_dir="$(cd "$(dirname "$0")/.." && pwd)"
    local deploy_dir="$base_dir/deployments/$site_name"
    
    log_info "🚀 Deploying Supabase-powered site: $site_name"
    log_info "📍 Port: $port"
    log_info "🔗 Supabase URL: $supabase_url"
    
    # Validation
    validate_site_name "$site_name" || return 1
    validate_port "$port" || return 1
    validate_url "$supabase_url" || return 1
    check_port_available "$port" || return 1
    check_deployment_exists "$site_name" || return 1
    
    # Test connection
    test_backend_connection "supabase" "$supabase_url" "$supabase_anon_key" || return 1
    
    # Create deployment structure
    create_deployment_dir "$deploy_dir" "$site_name" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Create Supabase configuration
    create_supabase_config "$deploy_dir" "$site_name" "$supabase_url" "$supabase_anon_key" "$supabase_project_id" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Create backend configuration
    create_backend_config "$deploy_dir" "supabase" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Create Docker Compose
    create_docker_compose "$deploy_dir" "$site_name" "$port"
    
    # Add backend type to docker-compose (cross-platform sed)
    if [ -f "$deploy_dir/docker-compose.yml" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/BACKEND_TYPE:-unknown/BACKEND_TYPE:-supabase/g" "$deploy_dir/docker-compose.yml"
        else
            # Linux
            sed -i "s/BACKEND_TYPE:-unknown/BACKEND_TYPE:-supabase/g" "$deploy_dir/docker-compose.yml"
        fi
    fi
    
    # Build and start
    build_and_start "$deploy_dir" "$site_name" "$port" || {
        cleanup_on_failure "$deploy_dir" "$site_name"
        return 1
    }
    
    # Show summary
    show_deployment_summary "$site_name" "$port" "Supabase" "$supabase_url" "$deploy_dir"
    
    return 0
}

create_supabase_config() {
    local deploy_dir=$1
    local site_name=$2
    local supabase_url=$3
    local supabase_anon_key=$4
    local supabase_project_id=$5
    
    log_step "Creating Supabase configuration..."
    
    cat > "$deploy_dir/src/config/supabase-config.ts" << EOF
// Supabase configuration for $site_name deployment
interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

const config: SupabaseConfig = {
  url: '$supabase_url',
  anonKey: '$supabase_anon_key',
  projectId: '$supabase_project_id'
};

export const getSupabaseConfig = (): SupabaseConfig => config;
export const SUPABASE_CONFIG = config;
EOF
    
    log_success "Supabase configuration created"
    return 0
}

create_backend_config() {
    local deploy_dir=$1
    local backend_type=$2
    
    log_step "Creating backend configuration..."
    
    # Update the backend config to force the backend type
    cat > "$deploy_dir/src/config/backend-config.ts" << 'EOF'
// Multi-backend configuration system
import { BackendAdapter, BackendType } from '@/lib/backend/types';
import { SupabaseAdapter, SupabaseConfig } from '@/lib/backend/supabase-adapter';
import { CloudboxAdapter, CloudboxConfig } from '@/lib/backend/cloudbox-adapter';

export interface BackendConfig {
  type: BackendType;
  supabase?: SupabaseConfig;
  cloudbox?: CloudboxConfig;
}

// Default configurations
const defaultSupabaseConfig: SupabaseConfig = {
  url: 'https://lpowueiolmezwzueljwx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3d1ZWlvbG1lend6dWVsand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTUxNzksImV4cCI6MjA3MjI5MTE3OX0.BROyQndQGBRqXt-g9Vc_IwQAsrXscJprp_aDIdso71Y',
  projectId: 'lpowueiolmezwzueljwx'
};

// Runtime backend configuration detection
export const getBackendConfig = (): BackendConfig => {
  // Force Supabase for this deployment
  const supabaseUrl = (window as any).__SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || defaultSupabaseConfig.url;
  const supabaseAnonKey = (window as any).__SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseConfig.anonKey;
  const supabaseProjectId = (window as any).__SUPABASE_PROJECT_ID__ || import.meta.env.VITE_SUPABASE_PROJECT_ID || defaultSupabaseConfig.projectId;

  return {
    type: 'supabase',
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      projectId: supabaseProjectId
    }
  };
};

// Backend adapter factory
export const createBackendAdapter = (config?: BackendConfig): BackendAdapter => {
  const finalConfig = config || getBackendConfig();

  switch (finalConfig.type) {
    case 'cloudbox':
      if (!finalConfig.cloudbox) {
        throw new Error('Cloudbox configuration is required for cloudbox backend type');
      }
      return new CloudboxAdapter(finalConfig.cloudbox);

    case 'supabase':
    default:
      if (!finalConfig.supabase) {
        throw new Error('Supabase configuration is required for supabase backend type');
      }
      return new SupabaseAdapter(finalConfig.supabase);
  }
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
export const SUPABASE_CONFIG = BACKEND_CONFIG.type === 'supabase' && BACKEND_CONFIG.supabase 
  ? BACKEND_CONFIG.supabase 
  : defaultSupabaseConfig;

export const getSupabaseConfig = () => SUPABASE_CONFIG;
EOF
    
    log_success "Backend configuration created"
    return 0
}