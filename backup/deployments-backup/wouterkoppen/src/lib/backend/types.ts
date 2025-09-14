// Backend abstraction types for multi-backend support

export type BackendType = 'supabase' | 'cloudbox' | 'local';

export interface AuthResult {
  user?: any;
  error?: any;
  session?: any;
}

export interface SignUpOptions {
  emailRedirectTo?: string;
  data?: Record<string, any>;
}

export interface AuthCallback {
  (event: string, session: any): void;
}

export interface Subscription {
  unsubscribe(): void;
}

export interface Session {
  user: any;
  access_token: string;
}

export interface QueryBuilder {
  select(columns?: string): QueryBuilder;
  insert(values: any): QueryBuilder;
  update(values: any): QueryBuilder;
  upsert(values: any, options?: { onConflict?: string }): QueryBuilder;
  delete(): QueryBuilder;
  eq(column: string, value: any): QueryBuilder;
  neq(column: string, value: any): QueryBuilder;
  gt(column: string, value: any): QueryBuilder;
  lt(column: string, value: any): QueryBuilder;
  gte(column: string, value: any): QueryBuilder;
  lte(column: string, value: any): QueryBuilder;
  like(column: string, pattern: string): QueryBuilder;
  ilike(column: string, pattern: string): QueryBuilder;
  in(column: string, values: any[]): QueryBuilder;
  is(column: string, value: any): QueryBuilder;
  not(column: string, operator: string, value: any): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  single(): QueryBuilder;
  maybeSingle(): QueryBuilder;
  then(resolve?: (value: any) => any, reject?: (reason: any) => any): Promise<any>;
}

export interface UploadResult {
  data?: {
    path: string;
    id: string;
    fullPath: string;
  };
  error?: any;
}

export interface StorageBucket {
  upload(path: string, file: File, options?: any): Promise<UploadResult>;
  download(path: string): Promise<{ data?: Blob; error?: any }>;
  remove(paths: string[]): Promise<{ data?: any; error?: any }>;
  list(path?: string, options?: any): Promise<{ data?: any[]; error?: any }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  createSignedUrl(path: string, expiresIn: number): Promise<{ data?: { signedUrl: string }; error?: any }>;
}

export interface FunctionResult {
  data?: any;
  error?: any;
}

export interface ScriptResult {
  success: boolean;
  data?: any;
  error?: any;
  message?: string;
}

export interface BackendAdapter {
  // Authentication
  auth: {
    signIn(email: string, password: string): Promise<AuthResult>;
    signUp(email: string, password: string, options?: SignUpOptions): Promise<AuthResult>;
    signOut(): Promise<void>;
    onAuthStateChange(callback: AuthCallback): Subscription;
    getSession(): Promise<Session | null>;
    getUser(): Promise<{ user?: any; error?: any }>;
  };
  
  // Database operations  
  from(table: string): QueryBuilder;
  
  // File storage
  storage: {
    from(bucket: string): StorageBucket;
    createBucket(id: string, options?: { public?: boolean }): Promise<{ data?: any; error?: any }>;
    getBucket(id: string): Promise<{ data?: any; error?: any }>;
    listBuckets(): Promise<{ data?: any[]; error?: any }>;
    deleteBucket(id: string): Promise<{ data?: any; error?: any }>;
  };
  
  // Functions/Scripts
  functions: {
    invoke(name: string, options?: { body?: any }): Promise<FunctionResult>;
  };
  
  // Setup scripts (Cloudbox specific, optional for Supabase)
  scripts?: {
    execute(script: string, params?: any): Promise<ScriptResult>;
    uploadFile(path: string, content: string): Promise<ScriptResult>;
    runMigration(migration: string): Promise<ScriptResult>;
  };

  // Connection validation
  validateConnection(): Promise<{ success: boolean; error?: string }>;
  
  // Backend info
  getBackendType(): BackendType;
  getConfig(): any;
}