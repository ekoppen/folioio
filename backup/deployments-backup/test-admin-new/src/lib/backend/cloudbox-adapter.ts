// Cloudbox adapter implementation
import { BackendAdapter, BackendType, QueryBuilder, StorageBucket, ScriptResult } from './types';

export interface CloudboxConfig {
  url: string;
  apiKey: string;
  projectId: string;
}

export class CloudboxAdapter implements BackendAdapter {
  private config: CloudboxConfig;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: CloudboxConfig) {
    this.config = config;
    this.baseUrl = config.url.replace(/\/+$/, ''); // Remove trailing slashes
    this.headers = {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json'
    };
  }

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/p/${this.config.projectId}/api${endpoint}`;
  }

  getBackendType(): BackendType {
    return 'cloudbox';
  }

  getConfig(): CloudboxConfig {
    return this.config;
  }

  async validateConnection() {
    try {
      // Try different common endpoints to validate connection
      const endpoints = ['/health', '/api', '/api/v1/status', ''];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: this.headers
          });
          
          // Accept any successful response or auth error (means server is reachable)
          if (response.ok || response.status === 401) {
            return { success: true };
          }
        } catch (error) {
          // Try next endpoint
          continue;
        }
      }
      
      return { success: false, error: 'Unable to connect to Cloudbox server' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Authentication methods
  auth = {
    signIn: async (email: string, password: string) => {
      try {
        const response = await fetch(this.getApiUrl('/auth/login'), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store session in localStorage for persistence
          localStorage.setItem('cloudbox_session', JSON.stringify(data.session));
          return {
            user: data.user,
            session: data.session,
            error: null
          };
        } else {
          return {
            user: null,
            session: null,
            error: data.error || { message: 'Login failed' }
          };
        }
      } catch (error: any) {
        return {
          user: null,
          session: null,
          error: { message: error.message }
        };
      }
    },

    signUp: async (email: string, password: string, options?: any) => {
      try {
        const response = await fetch(this.getApiUrl('/auth/register'), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ 
            email, 
            password,
            ...options?.data
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          return {
            user: data.user,
            session: data.session,
            error: null
          };
        } else {
          return {
            user: null,
            session: null,
            error: data.error || { message: 'Registration failed' }
          };
        }
      } catch (error: any) {
        return {
          user: null,
          session: null,
          error: { message: error.message }
        };
      }
    },

    signOut: async () => {
      localStorage.removeItem('cloudbox_session');
      // Optionally notify the server about logout
      try {
        await fetch(this.getApiUrl('/auth/logout'), {
          method: 'POST',
          headers: this.headers
        });
      } catch (error) {
        // Ignore server errors on logout
      }
    },

    onAuthStateChange: (callback: any) => {
      // Simple implementation - in real app, you'd want WebSocket or polling
      const checkSession = () => {
        const session = localStorage.getItem('cloudbox_session');
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            callback('SIGNED_IN', sessionData);
          } catch (error) {
            callback('SIGNED_OUT', null);
          }
        } else {
          callback('SIGNED_OUT', null);
        }
      };
      
      // Initial check
      checkSession();
      
      // Set up storage listener for cross-tab sync
      const storageListener = (e: StorageEvent) => {
        if (e.key === 'cloudbox_session') {
          checkSession();
        }
      };
      
      window.addEventListener('storage', storageListener);
      
      return {
        unsubscribe: () => {
          window.removeEventListener('storage', storageListener);
        }
      };
    },

    getSession: async () => {
      const session = localStorage.getItem('cloudbox_session');
      if (session) {
        try {
          return JSON.parse(session);
        } catch (error) {
          return null;
        }
      }
      return null;
    },

    getUser: async () => {
      const session = await this.auth.getSession();
      if (session?.user) {
        return { user: session.user, error: null };
      }
      return { user: null, error: { message: 'No user session' } };
    }
  };

  // Database operations
  from(table: string): QueryBuilder {
    return new CloudboxQueryBuilder(this.baseUrl, this.headers, table, this.config.projectId);
  }

  // Storage operations
  storage = {
    from: (bucket: string): StorageBucket => {
      return new CloudboxStorageBucket(this.baseUrl, this.headers, bucket, this.config.projectId);
    },

    createBucket: async (id: string, options?: { public?: boolean }) => {
      try {
        const response = await fetch(this.getApiUrl('/storage/buckets'), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ 
            id, 
            name: id,
            public: options?.public || false 
          })
        });
        
        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: data };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },

    getBucket: async (id: string) => {
      try {
        const response = await fetch(this.getApiUrl(`/storage/buckets/${id}`), {
          headers: this.headers
        });
        
        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: data };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },

    listBuckets: async () => {
      try {
        const response = await fetch(this.getApiUrl('/storage/buckets'), {
          headers: this.headers
        });
        
        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: data };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },

    deleteBucket: async (id: string) => {
      try {
        const response = await fetch(this.getApiUrl(`/storage/buckets/${id}`), {
          method: 'DELETE',
          headers: this.headers
        });
        
        if (response.ok) {
          return { data: { message: 'Bucket deleted' }, error: null };
        } else {
          const data = await response.json();
          return { data: null, error: data };
        }
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
  };

  // Functions (Scripts in Cloudbox)
  functions = {
    invoke: async (name: string, options?: { body?: any }) => {
      try {
        const response = await fetch(this.getApiUrl(`/scripts/${name}`), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(options?.body || {})
        });
        
        const data = await response.json();
        
        if (response.ok) {
          return { data, error: null };
        } else {
          return { data: null, error: data };
        }
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
  };

  // Cloudbox-specific scripts functionality
  scripts = {
    execute: async (script: string, params?: any): Promise<ScriptResult> => {
      try {
        const response = await fetch(this.getApiUrl('/scripts/execute'), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ script, params })
        });
        
        const data = await response.json();
        
        return {
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
          message: data.message
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Script execution failed'
        };
      }
    },

    uploadFile: async (path: string, content: string): Promise<ScriptResult> => {
      try {
        const response = await fetch(this.getApiUrl('/files/upload'), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ path, content })
        });
        
        const data = await response.json();
        
        return {
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
          message: data.message || (response.ok ? 'File uploaded successfully' : 'File upload failed')
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'File upload failed'
        };
      }
    },

    runMigration: async (migration: string): Promise<ScriptResult> => {
      try {
        const response = await fetch(this.getApiUrl('/database/migrate'), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ migration })
        });
        
        const data = await response.json();
        
        return {
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
          message: data.message || (response.ok ? 'Migration executed successfully' : 'Migration failed')
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Migration execution failed'
        };
      }
    }
  };
}

// Cloudbox QueryBuilder implementation
class CloudboxQueryBuilder implements QueryBuilder {
  private baseUrl: string;
  private headers: Record<string, string>;
  private table: string;
  private query: any = {};
  private projectId: string;

  constructor(baseUrl: string, headers: Record<string, string>, table: string, projectId?: string) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.table = table;
    this.projectId = projectId || '';
  }

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/p/${this.projectId}/api${endpoint}`;
  }

  select(columns?: string) {
    this.query.select = columns || '*';
    return this;
  }

  insert(values: any) {
    this.query.operation = 'insert';
    this.query.data = values;
    return this;
  }

  update(values: any) {
    this.query.operation = 'update';
    this.query.data = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.query.operation = 'upsert';
    this.query.data = values;
    this.query.options = options;
    return this;
  }

  delete() {
    this.query.operation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'gt', value });
    return this;
  }

  lt(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'lt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'gte', value });
    return this;
  }

  lte(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, pattern: string) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: 'is', value });
    return this;
  }

  not(column: string, operator: string, value: any) {
    this.query.where = this.query.where || [];
    this.query.where.push({ column, operator: `not.${operator}`, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.query.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.query.limit = count;
    return this;
  }

  range(from: number, to: number) {
    this.query.offset = from;
    this.query.limit = to - from + 1;
    return this;
  }

  single() {
    this.query.single = true;
    return this;
  }

  maybeSingle() {
    this.query.maybeSingle = true;
    return this;
  }

  async then(resolve?: any, reject?: any) {
    try {
      const method = this.query.operation === 'insert' || this.query.operation === 'update' 
        ? 'POST' 
        : this.query.operation === 'delete' 
        ? 'DELETE' 
        : 'GET';
      
      const url = this.getApiUrl(`/data/${this.table}`);
      
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: method !== 'GET' ? JSON.stringify(this.query) : undefined
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const finalResult = { data: result.data, error: null };
        return resolve ? resolve(finalResult) : finalResult;
      } else {
        const errorResult = { data: null, error: result };
        return reject ? reject(errorResult) : errorResult;
      }
    } catch (error: any) {
      const errorResult = { data: null, error: { message: error.message } };
      return reject ? reject(errorResult) : errorResult;
    }
  }
}

// Cloudbox StorageBucket implementation
class CloudboxStorageBucket implements StorageBucket {
  private baseUrl: string;
  private headers: Record<string, string>;
  private bucket: string;
  private projectId: string;

  constructor(baseUrl: string, headers: Record<string, string>, bucket: string, projectId?: string) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.bucket = bucket;
    this.projectId = projectId || '';
  }

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/p/${this.projectId}/api${endpoint}`;
  }

  async upload(path: string, file: File, options?: any) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      const response = await fetch(this.getApiUrl(`/storage/${this.bucket}/upload`), {
        method: 'POST',
        headers: {
          'X-API-Key': this.headers['X-API-Key']
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        return {
          data: {
            path: data.path,
            id: data.id || data.path,
            fullPath: data.fullPath || `${this.bucket}/${path}`
          },
          error: null
        };
      } else {
        return { data: null, error: data };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async download(path: string) {
    try {
      const response = await fetch(this.getApiUrl(`/storage/${this.bucket}/download/${path}`), {
        headers: this.headers
      });

      if (response.ok) {
        const blob = await response.blob();
        return { data: blob, error: null };
      } else {
        const data = await response.json();
        return { data: null, error: data };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async remove(paths: string[]) {
    try {
      const response = await fetch(this.getApiUrl(`/storage/${this.bucket}/delete`), {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({ paths })
      });

      const data = await response.json();
      return response.ok ? { data, error: null } : { data: null, error: data };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async list(path?: string, options?: any) {
    try {
      const params = new URLSearchParams();
      if (path) params.append('path', path);
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }

      const response = await fetch(this.getApiUrl(`/storage/${this.bucket}/list?${params}`), {
        headers: this.headers
      });

      const data = await response.json();
      return response.ok ? { data, error: null } : { data: null, error: data };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  getPublicUrl(path: string) {
    return {
      data: {
        publicUrl: this.getApiUrl(`/storage/${this.bucket}/public/${path}`)
      }
    };
  }

  async createSignedUrl(path: string, expiresIn: number) {
    try {
      const response = await fetch(this.getApiUrl(`/storage/${this.bucket}/sign`), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ path, expiresIn })
      });

      const data = await response.json();

      if (response.ok) {
        return { data: { signedUrl: data.signedUrl }, error: null };
      } else {
        return { data: null, error: data };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }
}