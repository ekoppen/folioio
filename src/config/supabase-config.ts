// Supabase configuration per deployment
// Each deployment should have its own Supabase project

interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

// Default configuration (current project)
const defaultConfig: SupabaseConfig = {
  url: 'https://lpowueiolmezwzueljwx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3d1ZWlvbG1lend6dWVsand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTUxNzksImV4cCI6MjA3MjI5MTE3OX0.BROyQndQGBRqXt-g9Vc_IwQAsrXscJprp_aDIdso71Y',
  projectId: 'lpowueiolmezwzueljwx'
};

// Get Supabase configuration
// This can be extended to read from environment variables or config files
export const getSupabaseConfig = (): SupabaseConfig => {
  // For Docker deployments, you can override these via environment variables
  const config: SupabaseConfig = {
    url: (window as any).__SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || defaultConfig.url,
    anonKey: (window as any).__SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultConfig.anonKey,
    projectId: (window as any).__SUPABASE_PROJECT_ID__ || import.meta.env.VITE_SUPABASE_PROJECT_ID || defaultConfig.projectId
  };

  return config;
};

// Export the configuration
export const SUPABASE_CONFIG = getSupabaseConfig();