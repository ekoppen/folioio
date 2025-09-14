const fs = require('fs').promises;
const path = require('path');
const { query } = require('./client');

/**
 * Runtime Database Migration System
 * Automatically runs migrations when the API server starts
 */
class DatabaseMigrator {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
    this.migrationsTable = 'schema_migrations';
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationsTable() {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR(255)
        );
      `;
      await query(createTableQuery);
      console.log('✅ Migration tracking table ready');
    } catch (error) {
      console.error('❌ Failed to initialize migration table:', error);
      throw error;
    }
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations() {
    try {
      const result = await query(`SELECT version FROM ${this.migrationsTable} ORDER BY version`);
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('Failed to get applied migrations:', error);
      return [];
    }
  }

  /**
   * Get list of available migration files
   */
  async getAvailableMigrations() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => ({
          version: path.basename(file, '.sql'),
          filename: file,
          filepath: path.join(this.migrationsDir, file)
        }));
    } catch (error) {
      console.log('📁 No migrations directory found or empty');
      return [];
    }
  }

  /**
   * Calculate simple checksum for migration file
   */
  async getFileChecksum(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const crypto = require('crypto');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration) {
    console.log(`📝 Applying migration: ${migration.version}`);
    
    try {
      // Read and execute migration SQL
      const sql = await fs.readFile(migration.filepath, 'utf8');
      
      // Remove any existing migration tracking inserts to avoid conflicts
      const cleanedSql = sql.replace(/INSERT INTO schema_migrations.*?;/gi, '');
      
      await query(cleanedSql);
      
      // Record migration as applied
      const checksum = await this.getFileChecksum(migration.filepath);
      await query(
        `INSERT INTO ${this.migrationsTable} (version, checksum) VALUES ($1, $2) 
         ON CONFLICT (version) DO UPDATE SET applied_at = NOW(), checksum = $2`,
        [migration.version, checksum]
      );
      
      console.log(`✅ Migration applied: ${migration.version}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migration.version}:`, error.message);
      return false;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    console.log('🔄 Checking for database migrations...');
    
    try {
      // Initialize migration tracking
      await this.initializeMigrationsTable();
      
      // Get current state
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      if (availableMigrations.length === 0) {
        console.log('📄 No migration files found');
        return { success: true, applied: 0, total: 0 };
      }
      
      // Find pending migrations
      const pendingMigrations = availableMigrations.filter(
        migration => !appliedMigrations.includes(migration.version)
      );
      
      console.log(`📊 Migration status:`);
      console.log(`   📁 Available: ${availableMigrations.length}`);
      console.log(`   ✅ Applied: ${appliedMigrations.length}`);
      console.log(`   ⏳ Pending: ${pendingMigrations.length}`);
      
      if (pendingMigrations.length === 0) {
        console.log('✨ Database is up to date');
        return { success: true, applied: 0, total: availableMigrations.length };
      }
      
      // Apply pending migrations
      let successCount = 0;
      for (const migration of pendingMigrations) {
        const success = await this.applyMigration(migration);
        if (success) {
          successCount++;
        } else {
          console.error(`❌ Migration failed, stopping at: ${migration.version}`);
          break;
        }
      }
      
      console.log(`🎉 Migration complete: ${successCount}/${pendingMigrations.length} applied`);
      
      return {
        success: successCount === pendingMigrations.length,
        applied: successCount,
        total: availableMigrations.length,
        pending: pendingMigrations.length
      };
      
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get migration status for health checks
   */
  async getMigrationStatus() {
    try {
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      const pendingMigrations = availableMigrations.filter(
        migration => !appliedMigrations.includes(migration.version)
      );
      
      return {
        available: availableMigrations.length,
        applied: appliedMigrations.length,
        pending: pendingMigrations.length,
        upToDate: pendingMigrations.length === 0,
        lastApplied: appliedMigrations.length > 0 ? appliedMigrations[appliedMigrations.length - 1] : null
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = new DatabaseMigrator();