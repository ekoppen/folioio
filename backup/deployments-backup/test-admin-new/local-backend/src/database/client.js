const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

let pool;

// Simplified database connection configuration (just use postgres superuser)
const dbConfig = {
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'portfolio_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Debug logging for database configuration
console.log('🔧 Database Configuration:');
console.log('  Host:', dbConfig.host);
console.log('  Port:', dbConfig.port);
console.log('  Database:', dbConfig.database);
console.log('  User:', dbConfig.user);
console.log('  Password:', dbConfig.password ? `${dbConfig.password.substring(0, 3)}***` : 'NOT SET');
console.log('  Environment variables:');
console.log('    DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('    DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('    DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('    DATABASE_USER:', process.env.DATABASE_USER);
console.log('    DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? `${process.env.DATABASE_PASSWORD.substring(0, 3)}***` : 'NOT SET');

// Initialize database connection with retry logic
async function initializeDatabase(maxRetries = 10) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Database connection attempt ${attempt}/${maxRetries}...`);
      
      pool = new Pool(dbConfig);
      
      // Test connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ Database connected successfully');
      
      // Run migrations if needed
      await runMigrations();
      
      return; // Success, exit retry loop
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      
      // Close any existing pool before retrying
      if (pool) {
        try {
          await pool.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        pool = null;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * attempt, 10000); // Exponential backoff, max 10s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`💥 Database connection failed after ${maxRetries} attempts`);
  throw lastError;
}

// Run database migrations
async function runMigrations() {
  try {
    const migrationsPath = path.join(__dirname, '../migrations');
    const migrationFiles = await fs.readdir(migrationsPath);
    
    // Sort migration files
    const sqlFiles = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const sql = await fs.readFile(path.join(migrationsPath, file), 'utf8');
      await pool.query(sql);
    }
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw here, migrations might already be applied
  }
}

// Get database pool
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

// Execute query with error handling
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Execute transaction
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDatabase,
  getPool,
  query,
  transaction
};