// Supabase adapter implementation
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { BackendAdapter, BackendType, QueryBuilder, StorageBucket } from './types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

export class SupabaseAdapter implements BackendAdapter {
  private client: SupabaseClient<Database>;
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.client = createClient<Database>(
      config.url,
      config.anonKey,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    );
  }

  getBackendType(): BackendType {
    return 'supabase';
  }

  getConfig(): SupabaseConfig {
    return this.config;
  }

  async validateConnection() {
    try {
      const { error } = await this.client.from('site_settings').select('id').limit(1);
      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Authentication methods
  auth = {
    signIn: async (email: string, password: string) => {
      const result = await this.client.auth.signInWithPassword({ email, password });
      return {
        user: result.data.user,
        error: result.error,
        session: result.data.session
      };
    },

    signUp: async (email: string, password: string, options?: any) => {
      const result = await this.client.auth.signUp({ email, password, options });
      return {
        user: result.data.user,
        error: result.error,
        session: result.data.session
      };
    },

    signOut: async () => {
      await this.client.auth.signOut();
    },

    onAuthStateChange: (callback: any) => {
      const { data } = this.client.auth.onAuthStateChange(callback);
      return data.subscription;
    },

    getSession: async () => {
      const { data } = await this.client.auth.getSession();
      return data.session;
    },

    getUser: async () => {
      const { data, error } = await this.client.auth.getUser();
      return { user: data.user, error };
    }
  };

  // Database operations
  from(table: string): QueryBuilder {
    const supabaseQuery = (this.client as any).from(table);
    return new SupabaseQueryBuilderWrapper(supabaseQuery);
  }

  // Storage operations
  storage = {
    from: (bucket: string): StorageBucket => {
      const supabaseStorage = this.client.storage.from(bucket);
      
      return {
        upload: async (path: string, file: File, options?: any) => {
          const result = await supabaseStorage.upload(path, file, options);
          return {
            data: result.data ? {
              path: result.data.path,
              id: result.data.id || result.data.path,
              fullPath: result.data.fullPath || result.data.path
            } : undefined,
            error: result.error
          };
        },
        download: (path: string) => supabaseStorage.download(path),
        remove: (paths: string[]) => supabaseStorage.remove(paths),
        list: (path?: string, options?: any) => supabaseStorage.list(path, options),
        getPublicUrl: (path: string) => supabaseStorage.getPublicUrl(path),
        createSignedUrl: (path: string, expiresIn: number) => supabaseStorage.createSignedUrl(path, expiresIn)
      };
    },

    createBucket: (id: string, options?: { public?: boolean }) => 
      this.client.storage.createBucket(id, { public: options?.public || false }),
    
    getBucket: (id: string) => this.client.storage.getBucket(id),
    
    listBuckets: () => this.client.storage.listBuckets(),
    
    deleteBucket: (id: string) => this.client.storage.deleteBucket(id)
  };

  // Functions
  functions = {
    invoke: async (name: string, options?: { body?: any }) => {
      const result = await this.client.functions.invoke(name, options);
      return {
        data: result.data,
        error: result.error
      };
    }
  };
}

// Supabase QueryBuilder wrapper class
class SupabaseQueryBuilderWrapper implements QueryBuilder {
  private query: any;

  constructor(supabaseQuery: any) {
    this.query = supabaseQuery;
  }

  select(columns?: string) {
    this.query = columns ? this.query.select(columns) : this.query.select();
    return this;
  }

  insert(values: any) {
    this.query = this.query.insert(values);
    return this;
  }

  update(values: any) {
    this.query = this.query.update(values);
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.query = this.query.upsert(values, options);
    return this;
  }

  delete() {
    this.query = this.query.delete();
    return this;
  }

  eq(column: string, value: any) {
    this.query = this.query.eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.query = this.query.neq(column, value);
    return this;
  }

  gt(column: string, value: any) {
    this.query = this.query.gt(column, value);
    return this;
  }

  lt(column: string, value: any) {
    this.query = this.query.lt(column, value);
    return this;
  }

  gte(column: string, value: any) {
    this.query = this.query.gte(column, value);
    return this;
  }

  lte(column: string, value: any) {
    this.query = this.query.lte(column, value);
    return this;
  }

  like(column: string, pattern: string) {
    this.query = this.query.like(column, pattern);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.query = this.query.ilike(column, pattern);
    return this;
  }

  in(column: string, values: any[]) {
    this.query = this.query.in(column, values);
    return this;
  }

  is(column: string, value: any) {
    this.query = this.query.is(column, value);
    return this;
  }

  not(column: string, operator: string, value: any) {
    this.query = this.query.not(column, operator, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }

  range(from: number, to: number) {
    this.query = this.query.range(from, to);
    return this;
  }

  single() {
    this.query = this.query.single();
    return this;
  }

  maybeSingle() {
    this.query = this.query.maybeSingle();
    return this;
  }

  then(resolve?: any, reject?: any) {
    return this.query.then(resolve, reject);
  }
}