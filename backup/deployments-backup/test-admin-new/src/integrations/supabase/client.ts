// Multi-backend client - supports both Supabase and Cloudbox
import { backend } from '@/lib/backend/client';

// Export backend as supabase for backward compatibility
export const supabase = backend;