#!/bin/bash

# Create Admin User Wrapper Script
# Starts a temporary container to run the admin creation script

set -e

DEPLOYMENT_DIR=$(pwd)
DEPLOYMENT_NAME=$(basename "$DEPLOYMENT_DIR")

# Check if we're in a deployment directory
if [[ ! -f "docker-compose.yml" ]] || [[ ! -f ".env" ]]; then
    echo "❌ Error: This script must be run from a deployment directory"
    echo "   Expected files: docker-compose.yml, .env"
    echo "   Current directory: $DEPLOYMENT_DIR"
    exit 1
fi

# Check if containers are running
if ! docker compose ps | grep -q "Up.*healthy"; then
    echo "❌ Error: No healthy containers found"
    echo "   Please start the deployment first: docker compose up -d"
    exit 1
fi

echo "🔧 Portfolio Admin Account Creator"
echo "📁 Deployment: $DEPLOYMENT_NAME"
echo "🌐 Network: ${DEPLOYMENT_NAME}_portfolio-network"
echo ""

# Run a temporary container with interactive mode
# Mount the current directory and connect to the deployment's network
docker run --rm -it \
  --network "${DEPLOYMENT_NAME}_portfolio-network" \
  --volume "$DEPLOYMENT_DIR:/workspace" \
  --workdir /workspace \
  --env-file .env \
  node:18-alpine \
  sh -c "
    # Install required packages
    npm install --no-save pg bcryptjs dotenv readline-sync

    # Create and run the admin script inline with ES module syntax
    cat > create-admin-temp.mjs << 'EOF'
import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcryptjs';
import readlineSync from 'readline-sync';
import dotenv from 'dotenv';
dotenv.config();

async function createAdmin() {
  console.log('\\n📋 Creating admin user...\\n');

  // Get user input
  const email = readlineSync.question('📧 Admin email: ');
  if (!email || !email.includes('@')) {
    console.log('❌ Invalid email address');
    process.exit(1);
  }

  const password = readlineSync.question('🔐 Admin password (min 6 chars): ', { hideEchoBack: true });
  if (!password || password.length < 6) {
    console.log('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  const confirmPassword = readlineSync.question('🔐 Confirm password: ', { hideEchoBack: true });
  if (password !== confirmPassword) {
    console.log('❌ Passwords do not match');
    process.exit(1);
  }

  try {
    // Database connection via Docker network
    const pool = new Pool({
      user: process.env.DATABASE_USER || 'postgres',
      host: 'postgres', // Docker service name
      database: process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'portfolio_db',
      password: process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD,
      port: 5432,
    });

    console.log('\\n🔌 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Try to create new user
      const userResult = await pool.query(
        \`INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
         VALUES (\$1, \$2, NOW(), NOW(), NOW()) RETURNING id\`,
        [email, hashedPassword]
      );

      const userId = userResult.rows[0].id;

      // Create profile
      await pool.query(
        \`INSERT INTO public.profiles (user_id, email, role, created_at, updated_at)
         VALUES (\$1, \$2, \$3, NOW(), NOW())\`,
        [userId, email, 'admin']
      );

      console.log('✅ Admin account created successfully!');

    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('ℹ️  User already exists. Updating password and admin role...');

        // Update existing user password
        await pool.query(
          'UPDATE auth.users SET encrypted_password = \$1, updated_at = NOW() WHERE email = \$2',
          [hashedPassword, email]
        );

        // Update profile role to admin
        await pool.query(
          'UPDATE public.profiles SET role = \$1, updated_at = NOW() WHERE email = \$2',
          ['admin', email]
        );

        console.log('✅ Existing user updated to admin successfully!');
      } else {
        throw error;
      }
    }

    console.log('\\n📋 Account Details:');
    console.log(\`   📧 Email: \${email}\`);
    console.log('   🔑 Role: admin');
    console.log(\`\\n🌐 Login URL: http://localhost:\${process.env.FRONTEND_PORT || '3000'}/admin\`);
    console.log('');

    await pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\\n💡 Troubleshooting:');
    console.log('   - Check that containers are running: docker compose ps');
    console.log('   - Check database logs: docker compose logs postgres');
    console.log('   - Verify .env file has correct DATABASE_PASSWORD');
    process.exit(1);
  }
}

createAdmin().catch(console.error);
EOF

    # Run the admin script
    node create-admin-temp.mjs
  "