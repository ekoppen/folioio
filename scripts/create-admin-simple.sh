#!/bin/bash

# Simple create admin user script using direct SQL
# Usage: ./create-admin-simple.sh [container-prefix]

CONTAINER_PREFIX=${1:-portfolio}

echo "🔐 Create Admin User for Portfolio Site"
echo "======================================="
echo "Container prefix: $CONTAINER_PREFIX"
echo ""

# Check if database container is running
if ! docker ps | grep -q "${CONTAINER_PREFIX}-db"; then
    echo "❌ Error: Container ${CONTAINER_PREFIX}-db is not running"
    exit 1
fi

# Prompt for email
read -p "Enter admin email: " ADMIN_EMAIL

echo ""
echo "⚠️  TEMPORARY PASSWORD WILL BE: TempPassword123!"
echo "⚠️  You MUST change this after first login!"
echo ""

# Confirm
read -p "Create admin user ${ADMIN_EMAIL}? (y/N): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Create admin user with a known bcrypt hash for TempPassword123!
docker exec ${CONTAINER_PREFIX}-db psql -U postgres -d portfolio_db -c "
INSERT INTO users (email, password_hash, role, created_at, updated_at)
VALUES ('${ADMIN_EMAIL}', '\$2b\$10\$rBxVDhM6On4m6L4QwZmWW.8/ghL7TSAXbCwZ9F0Ste5EqcQyWlRQa', 'admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE 
SET password_hash = '\$2b\$10\$rBxVDhM6On4m6L4QwZmWW.8/ghL7TSAXbCwZ9F0Ste5EqcQyWlRQa',
    role = 'admin',
    updated_at = NOW()
RETURNING email, role;
"

echo ""
echo "✅ Admin user created/updated!"
echo ""
echo "📝 Login credentials:"
echo "   Email: ${ADMIN_EMAIL}"
echo "   Password: TempPassword123!"
echo ""
echo "⚠️  IMPORTANT: Change your password immediately after logging in!"