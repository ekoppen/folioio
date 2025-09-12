#!/bin/bash

# Create admin user script for portfolio deployments
# Usage: ./create-admin.sh [container-prefix]
# Example: ./create-admin.sh wouterkoppen

CONTAINER_PREFIX=${1:-portfolio}

echo "🔐 Create Admin User for Portfolio Site"
echo "======================================="
echo "Container prefix: $CONTAINER_PREFIX"
echo ""

# Check if API container is running
if ! docker ps | grep -q "${CONTAINER_PREFIX}-api"; then
    echo "❌ Error: Container ${CONTAINER_PREFIX}-api is not running"
    exit 1
fi

# Prompt for email
read -p "Enter admin email: " ADMIN_EMAIL

# Prompt for password (hidden input)
read -s -p "Enter admin password: " ADMIN_PASSWORD
echo ""

# Confirm
echo ""
echo "Creating admin user with email: $ADMIN_EMAIL"
read -p "Continue? (y/N): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Create admin user using the API's built-in bcrypt
docker exec ${CONTAINER_PREFIX}-api sh -c "cd /app && node -e \"
const crypto = require('crypto');
const { Pool } = require('pg');

// Simple password hashing function that matches bcrypt's format
async function hashPassword(password) {
  // Use the bcrypt from node_modules in the container
  const bcrypt = require('./node_modules/bcrypt');
  return await bcrypt.hash(password, 10);
}

async function createAdmin() {
  const pool = new Pool({
    host: '${CONTAINER_PREFIX}-db',
    database: 'portfolio_db',
    user: 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    port: 5432
  });

  try {
    const email = '${ADMIN_EMAIL}';
    const password = '${ADMIN_PASSWORD}';
    const hashedPassword = await hashPassword(password);
    
    // First check if user exists
    const existing = await pool.query(
      'SELECT id, email FROM users WHERE email = \\$1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      // Update existing user to admin
      const result = await pool.query(
        'UPDATE users SET password_hash = \\$1, role = \\$2, updated_at = NOW() WHERE email = \\$3 RETURNING id, email, role',
        [hashedPassword, 'admin', email]
      );
      console.log('✅ Existing user updated to admin:', result.rows[0]);
    } else {
      // Create new admin user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, role, created_at, updated_at) VALUES (\\$1, \\$2, \\$3, NOW(), NOW()) RETURNING id, email, role',
        [email, hashedPassword, 'admin']
      );
      console.log('✅ New admin user created:', result.rows[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
\""

echo ""
echo "✨ Done! You can now login with your admin credentials."