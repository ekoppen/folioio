#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config({ path: './local-backend/.env' });

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
    // Database connection
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'portfolio',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
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

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists. Updating to admin role...');

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update existing user
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2, updated_at = NOW() WHERE email = $3',
        [hashedPassword, 'admin', email]
      );

      console.log('✅ Existing user updated to admin successfully!');
    } else {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new admin user
      await pool.query(
        `INSERT INTO users (email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [email, hashedPassword, 'admin']
      );

      console.log('✅ Admin account created successfully!');
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
    console.log('   - Database is running');
    console.log('   - Environment variables are set in local-backend/.env');
    console.log('   - Database has been migrated');

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