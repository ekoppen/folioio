#!/usr/bin/env node

import { createRequire } from 'module';
import readline from 'readline';

// Create require function to load CommonJS modules
const require = createRequire(import.meta.url);

// Load all dependencies from local-backend node_modules
const { Pool } = require('./local-backend/node_modules/pg');
const bcrypt = require('./local-backend/node_modules/bcryptjs');
const dotenv = require('./local-backend/node_modules/dotenv');

dotenv.config({ path: './.env' });

/**
 * Create Admin User Script
 *
 * Creates an admin user for a deployment using direct database access
 *
 * Usage (inside deployment directory):
 *   docker compose exec api-server node /app/../create-admin.js
 *
 * Or copy script to container and run interactively
 */

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Function to prompt for password (hidden input)
function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    stdin.on('data', function(char) {
      char = char + '';

      switch(char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

async function createAdmin() {
  console.log('🔧 Portfolio Admin Account Creator\n');

  try {
    // Database connection - try Docker first, then localhost
    const pool = new Pool({
      user: process.env.DATABASE_USER || process.env.POSTGRES_USER || 'postgres',
      host: process.env.DATABASE_HOST || 'postgres', // Use Docker service name
      database: process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'portfolio_db',
      password: process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD,
      port: process.env.DATABASE_PORT || 5432,
    });

    // Test connection
    console.log('🔌 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    // Get user input
    const email = await askQuestion('📧 Admin email: ');
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    const password = await askPassword('🔐 Admin password: ');
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const confirmPassword = await askPassword('🔐 Confirm password: ');
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    console.log('\n⏳ Creating admin account...');

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Try to create new user
      const userResult = await pool.query(
        `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW(), NOW()) RETURNING id`,
        [email, hashedPassword]
      );

      const userId = userResult.rows[0].id;

      // Create profile for the user
      await pool.query(
        `INSERT INTO public.profiles (user_id, email, role, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, email, 'admin']
      );

      console.log('✅ Admin account created successfully!');

    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('ℹ️  User already exists. Updating password and admin role...');

        // Update existing user password
        await pool.query(
          'UPDATE auth.users SET encrypted_password = $1, updated_at = NOW() WHERE email = $2',
          [hashedPassword, email]
        );

        // Update profile role to admin
        await pool.query(
          'UPDATE public.profiles SET role = $1, updated_at = NOW() WHERE email = $2',
          ['admin', email]
        );

        console.log('✅ Existing user updated to admin successfully!');
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    console.log('\n📋 Account Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log('\n🌐 You can now login at: /auth');
    console.log('🛠️  Access admin panel at: /admin');

    await pool.end();
    rl.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Database is running (docker compose ps)');
    console.log('   - Environment variables are set in .env');
    console.log('   - Database has been migrated');
    console.log('   - You are in the deployment directory');

    rl.close();
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

// Run the script
createAdmin();