// Multi-backend configuration system
import { BackendAdapter, BackendType } from '@/lib/backend/types';
import { SupabaseAdapter, SupabaseConfig } from '@/lib/backend/supabase-adapter';
import { CloudboxAdapter, CloudboxConfig } from '@/lib/backend/cloudbox-adapter';
import { LocalAdapter, LocalConfig } from '@/lib/backend/local-adapter';

export interface BackendConfig {
  type: 'supabase' | 'cloudbox' | 'local';
  supabase?: SupabaseConfig;
  cloudbox?: CloudboxConfig;
  local?: LocalConfig;
}

// Default configurations
const defaultSupabaseConfig: SupabaseConfig = {
  url: 'https://lpowueiolmezwzueljwx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3d1ZWlvbG1lend6dWVsand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTUxNzksImV4cCI6MjA3MjI5MTE3OX0.BROyQndQGBRqXt-g9Vc_IwQAsrXscJprp_aDIdso71Y',
  projectId: 'lpowueiolmezwzueljwx'
};

// Auto-detect backend configuration based on available environment variables
export function getBackendConfig(): BackendConfig {
  // Check for forced local backend (Docker environment)
  const forceLocal = (window as any).__FORCE_LOCAL_BACKEND__;
  const globalApiUrl = (window as any).__LOCAL_API_URL__;
  
  // Check for Local backend configuration first
  const localApiUrl = import.meta.env.VITE_LOCAL_API_URL;
  const backendType = import.meta.env.VITE_BACKEND_TYPE;
  
  if (forceLocal || backendType === 'local' || localApiUrl) {
    // For local backend, always use /api relative path
    // This way nginx can proxy it properly
    const apiUrl = '/api';
    
    console.log('🔄 Using Local backend at:', apiUrl);
    return {
      type: 'local',
      local: {
        apiUrl: apiUrl
      }
    };
  }
  
  // Check for Cloudbox configuration
  const cloudboxUrl = (window as any).__CLOUDBOX_URL__ || import.meta.env.VITE_CLOUDBOX_URL;
  const cloudboxApiKey = (window as any).__CLOUDBOX_API_KEY__ || import.meta.env.VITE_CLOUDBOX_API_KEY;
  const cloudboxProjectId = (window as any).__CLOUDBOX_PROJECT_ID__ || import.meta.env.VITE_CLOUDBOX_PROJECT_ID;

  if (cloudboxUrl && cloudboxApiKey && cloudboxProjectId) {
    console.log('🔄 Using Cloudbox backend');
    return {
      type: 'cloudbox',
      cloudbox: {
        url: cloudboxUrl,
        apiKey: cloudboxApiKey,
        projectId: cloudboxProjectId
      }
    };
  }

  // Fall back to Supabase
  console.log('🔄 Using Supabase backend');
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
}

// Factory function to create backend adapter
export function createBackendAdapter(config?: BackendConfig): BackendAdapter {
  const backendConfig = config || getBackendConfig();
  
  switch (backendConfig.type) {
    case 'local':
      if (!backendConfig.local) {
        throw new Error('Local backend configuration is missing');
      }
      return new LocalAdapter(backendConfig.local);
      
    case 'cloudbox':
      if (!backendConfig.cloudbox) {
        throw new Error('Cloudbox configuration is missing');
      }
      return new CloudboxAdapter(backendConfig.cloudbox);
      
    case 'supabase':
    default:
      const supabaseConfig = backendConfig.supabase || defaultSupabaseConfig;
      return new SupabaseAdapter(supabaseConfig);
  }
}

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