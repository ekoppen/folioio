// Unified backend client
// This replaces the direct Supabase client imports throughout the application

import { getBackendAdapter } from '@/config/backend-config';

// Export the backend adapter as the main client
export const backend = getBackendAdapter();

// Legacy compatibility - export as supabase for existing code
export const supabase = backend;

// Re-export for convenience
export { getBackendAdapter };
export type { BackendAdapter } from './types';