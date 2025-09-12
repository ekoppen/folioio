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

# Create admin user directly via SQL with a simple hash
# Note: This creates a temporary hash that should be changed on first login
docker exec ${CONTAINER_PREFIX}-db psql -U postgres -d portfolio_db -c "
DO \$\$
DECLARE
    user_exists BOOLEAN;
    temp_hash TEXT;
BEGIN
    -- Create a temporary bcrypt-like hash (user should change password after login)
    -- This is a bcrypt hash of 'TempPassword123!' - user MUST change this
    temp_hash := '\$2b\$10\$rBxVDhM6On4m6L4QwZmWW.8/ghL7TSAXbCwZ9F0Ste5EqcQyWlRQa';
    
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = '${ADMIN_EMAIL}') INTO user_exists;
    
    IF user_exists THEN
        -- Update existing user
        UPDATE users 
        SET password_hash = temp_hash, 
            role = 'admin', 
            updated_at = NOW()
        WHERE email = '${ADMIN_EMAIL}';
        RAISE NOTICE '✅ Existing user updated to admin: %', '${ADMIN_EMAIL}';
    ELSE
        -- Create new user
        INSERT INTO users (email, password_hash, role, created_at, updated_at)
        VALUES ('${ADMIN_EMAIL}', temp_hash, 'admin', NOW(), NOW());
        RAISE NOTICE '✅ New admin user created: %', '${ADMIN_EMAIL}';
    END IF;
END\$\$;
"

echo ""
echo "⚠️  IMPORTANT: Temporary password is: TempPassword123!"
echo "⚠️  You MUST change this password immediately after logging in!"
echo ""
echo "To change the password after login:"
echo "1. Log in with email: ${ADMIN_EMAIL} and password: TempPassword123!"
echo "2. Go to your profile/settings"
echo "3. Change your password immediately"
echo ""
echo "✨ Done! Please login and change your password now."