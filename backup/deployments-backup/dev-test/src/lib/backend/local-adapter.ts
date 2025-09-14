// Local backend adapter for self-hosted PostgreSQL + Minio setup
import { BackendAdapter, BackendType, AuthResult, SignUpOptions, AuthCallback, Subscription, Session, QueryBuilder, UploadResult, StorageBucket, FunctionResult } from './types';

export interface LocalConfig {
  apiUrl: string;
  apiKey?: string;
}

class LocalQueryBuilder implements QueryBuilder {
  private table: string;
  private selectCols = '*';
  private insertData: any = null;
  private updateData: any = null;
  private upsertData: any = null;
  private upsertOptions: any = null;
  private whereConditions: string[] = [];
  private orderByClause = '';
  private limitCount = 0;
  private rangeFrom = 0;
  private rangeTo = 0;
  private singleResult = false;
  private maybeSingleResult = false;
  private deleteQuery = false;

  constructor(private adapter: LocalAdapter, table: string) {
    this.table = table;
  }

  select(columns = '*'): QueryBuilder {
    this.selectCols = columns;
    return this;
  }

  insert(values: any): QueryBuilder {
    this.insertData = values;
    return this;
  }

  update(values: any): QueryBuilder {
    this.updateData = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }): QueryBuilder {
    this.upsertData = values;
    this.upsertOptions = options;
    return this;
  }

  delete(): QueryBuilder {
    this.deleteQuery = true;
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    this.whereConditions.push(`${column} = ${this.formatValue(value)}`);
    return this;
  }

  neq(column: string, value: any): QueryBuilder {
    this.whereConditions.push(`${column} != ${this.formatValue(value)}`);
    return this;
  }

  gt(column: string, value: any): QueryBuilder {
    this.whereConditions.push(`${column} > ${this.formatValue(value)}`);
    return this;
  }

  lt(column: string, value: any): QueryBuilder {
    this.whereConditions.push(`${column} < ${this.formatValue(value)}`);
    return this;
  }

  gte(column: string, value: any): QueryBuilder {
    this.whereConditions.push(`${column} >= ${this.formatValue(value)}`);
    return this;
  }

  lte(column: string, value: any): QueryBuilder {
    this.whereConditions.push(`${column} <= ${this.formatValue(value)}`);
    return this;
  }

  like(column: string, pattern: string): QueryBuilder {
    this.whereConditions.push(`${column} LIKE ${this.formatValue(pattern)}`);
    return this;
  }

  ilike(column: string, pattern: string): QueryBuilder {
    this.whereConditions.push(`${column} ILIKE ${this.formatValue(pattern)}`);
    return this;
  }

  in(column: string, values: any[]): QueryBuilder {
    const formattedValues = values.map(v => this.formatValue(v)).join(', ');
    this.whereConditions.push(`${column} IN (${formattedValues})`);
    return this;
  }

  is(column: string, value: any): QueryBuilder {
    if (value === null) {
      this.whereConditions.push(`${column} IS NULL`);
    } else {
      this.whereConditions.push(`${column} IS ${this.formatValue(value)}`);
    }
    return this;
  }

  not(column: string, operator: string, value: any): QueryBuilder {
    this.whereConditions.push(`NOT (${column} ${operator} ${this.formatValue(value)})`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    const direction = options?.ascending === false ? 'DESC' : 'ASC';
    this.orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): QueryBuilder {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single(): QueryBuilder {
    this.singleResult = true;
    return this;
  }

  maybeSingle(): QueryBuilder {
    this.maybeSingleResult = true;
    return this;
  }

  private formatValue(value: any): string {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return `'${JSON.stringify(value)}'`;
    return value.toString();
  }

  async then(resolve?: (value: any) => any, reject?: (reason: any) => any): Promise<any> {
    try {
      const result = await this.execute();
      return resolve ? resolve(result) : result;
    } catch (error) {
      if (reject) return reject(error);
      throw error;
    }
  }

  private async execute(): Promise<any> {
    const payload: any = {
      table: this.table,
      operation: this.deleteQuery ? 'delete' : this.insertData ? 'insert' : this.updateData ? 'update' : this.upsertData ? 'upsert' : 'select',
      select: this.selectCols,
      where: this.whereConditions,
      orderBy: this.orderByClause,
      limit: this.limitCount,
      range: this.rangeFrom || this.rangeTo ? { from: this.rangeFrom, to: this.rangeTo } : null,
      single: this.singleResult || this.maybeSingleResult,
      maybeSingle: this.maybeSingleResult
    };

    if (this.insertData) payload.data = this.insertData;
    if (this.updateData) payload.data = this.updateData;
    if (this.upsertData) {
      payload.data = this.upsertData;
      payload.options = this.upsertOptions;
    }

    const response = await fetch(`${this.adapter.config.apiUrl}/database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.adapter.getToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Database operation failed');
    }

    return await response.json();
  }
}

class LocalStorageBucket implements StorageBucket {
  constructor(private adapter: LocalAdapter, private bucketName: string) {}

  async upload(path: string, file: File, options?: any): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch(`${this.adapter.config.apiUrl}/storage/${this.bucketName}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.adapter.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      return { error };
    }

    const data = await response.json();
    return { data };
  }

  async download(path: string): Promise<{ data?: Blob; error?: any }> {
    try {
      const response = await fetch(`${this.adapter.config.apiUrl}/storage/${this.bucketName}/download/${encodeURIComponent(path)}`, {
        headers: {
          'Authorization': `Bearer ${await this.adapter.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Download failed' }));
        return { error };
      }

      const data = await response.blob();
      return { data };
    } catch (error) {
      return { error };
    }
  }

  async remove(paths: string[]): Promise<{ data?: any; error?: any }> {
    try {
      const response = await fetch(`${this.adapter.config.apiUrl}/storage/${this.bucketName}/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.adapter.getToken()}`
        },
        body: JSON.stringify({ paths })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Remove failed' }));
        return { error };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error };
    }
  }

  async list(path = '', options?: any): Promise<{ data?: any[]; error?: any }> {
    try {
      const response = await fetch(`${this.adapter.config.apiUrl}/storage/${this.bucketName}/list?path=${encodeURIComponent(path)}`, {
        headers: {
          'Authorization': `Bearer ${await this.adapter.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'List failed' }));
        return { error };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error };
    }
  }

  getPublicUrl(path: string): { data: { publicUrl: string } } {
    return {
      data: {
        publicUrl: `${this.adapter.config.apiUrl}/storage/${this.bucketName}/public/${encodeURIComponent(path)}`
      }
    };
  }

  async createSignedUrl(path: string, expiresIn: number): Promise<{ data?: { signedUrl: string }; error?: any }> {
    try {
      const response = await fetch(`${this.adapter.config.apiUrl}/storage/${this.bucketName}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.adapter.getToken()}`
        },
        body: JSON.stringify({ path, expiresIn })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Signed URL creation failed' }));
        return { error };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error };
    }
  }
}

export class LocalAdapter implements BackendAdapter {
  private token: string | null = null;
  private authCallbacks: AuthCallback[] = [];
  public config: LocalConfig;

  constructor(config: LocalConfig) {
    this.config = config;
  }

  // Authentication
  auth = {
    signIn: async (email: string, password: string): Promise<AuthResult> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const result = await response.json();
        this.token = result.access_token;
        
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('local_auth_token', result.access_token);
        }

        // Notify callbacks
        this.authCallbacks.forEach(callback => callback('SIGNED_IN', result));

        return { user: result.user, session: result };
      } catch (error) {
        return { error };
      }
    },

    signUp: async (email: string, password: string, options?: SignUpOptions): Promise<AuthResult> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, ...options?.data })
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const result = await response.json();
        return { user: result.user, session: result };
      } catch (error) {
        return { error };
      }
    },

    signOut: async (): Promise<void> => {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('local_auth_token');
      }
      this.authCallbacks.forEach(callback => callback('SIGNED_OUT', null));
    },

    onAuthStateChange: (callback: AuthCallback): Subscription => {
      this.authCallbacks.push(callback);
      return {
        unsubscribe: () => {
          const index = this.authCallbacks.indexOf(callback);
          if (index > -1) this.authCallbacks.splice(index, 1);
        }
      };
    },

    getSession: async (): Promise<Session | null> => {
      if (!this.token && typeof window !== 'undefined') {
        this.token = localStorage.getItem('local_auth_token');
      }

      if (!this.token) return null;

      try {
        const response = await fetch(`${this.config.apiUrl}/auth/session`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });

        if (!response.ok) {
          this.token = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('local_auth_token');
          }
          return null;
        }

        const session = await response.json();
        return session;
      } catch (error) {
        return null;
      }
    },

    getUser: async (): Promise<{ user?: any; error?: any }> => {
      const session = await this.auth.getSession();
      return session ? { user: session.user } : { error: { message: 'No user found' } };
    }
  };

  // Database operations
  from(table: string): QueryBuilder {
    return new LocalQueryBuilder(this, table);
  }

  // File storage
  storage = {
    from: (bucket: string): StorageBucket => {
      return new LocalStorageBucket(this, bucket);
    },

    createBucket: async (id: string, options?: { public?: boolean }): Promise<{ data?: any; error?: any }> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/storage/buckets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getToken()}`
          },
          body: JSON.stringify({ id, public: options?.public })
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        return { error };
      }
    },

    getBucket: async (id: string): Promise<{ data?: any; error?: any }> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/storage/buckets/${id}`, {
          headers: { 'Authorization': `Bearer ${await this.getToken()}` }
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        return { error };
      }
    },

    listBuckets: async (): Promise<{ data?: any[]; error?: any }> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/storage/buckets`, {
          headers: { 'Authorization': `Bearer ${await this.getToken()}` }
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        return { error };
      }
    },

    deleteBucket: async (id: string): Promise<{ data?: any; error?: any }> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/storage/buckets/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${await this.getToken()}` }
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        return { error };
      }
    }
  };

  // Functions
  functions = {
    invoke: async (name: string, options?: { body?: any }): Promise<FunctionResult> => {
      try {
        const response = await fetch(`${this.config.apiUrl}/functions/${name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getToken()}`
          },
          body: JSON.stringify(options?.body || {})
        });

        if (!response.ok) {
          const error = await response.json();
          return { error };
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        return { error };
      }
    }
  };

  // Connection validation
  async validateConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`);
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: 'API not responding' };
    } catch (error) {
      return { success: false, error: 'Connection failed' };
    }
  }

  // Backend info
  getBackendType(): BackendType {
    return 'local' as BackendType;
  }

  getConfig(): LocalConfig {
    return this.config;
  }

  // Internal helper
  async getToken(): Promise<string> {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('local_auth_token');
    }
    return this.token || '';
  }
}