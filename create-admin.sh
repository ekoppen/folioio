#!/bin/bash

# Script to create an admin user for a deployment
# Usage: ./create-admin.sh <deployment-name> <email> <password>

DEPLOYMENT=$1
EMAIL=${2:-"admin@portfolio.local"}
PASSWORD=${3:-"admin123"}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <deployment-name> [email] [password]"
    echo "Example: $0 wouterkoppen admin@wouterkoppen.com mypassword"
    echo ""
    echo "Default credentials if not specified:"
    echo "  Email: admin@portfolio.local"
    echo "  Password: admin123"
    exit 1
fi

DEPLOY_DIR="deployments/$DEPLOYMENT"

if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Deployment '$DEPLOYMENT' not found"
    exit 1
fi

cd "$DEPLOY_DIR"

echo "🔐 Creating admin user..."
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo ""

# First, try to create the user via API
echo "📝 Creating user account..."
RESPONSE=$(docker compose exec -T nginx sh -c "curl -s -X POST http://api-server:3000/auth/signup \
    -H 'Content-Type: application/json' \
    -d '{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Site Administrator\"}'")

if echo "$RESPONSE" | grep -q "error"; then
    if echo "$RESPONSE" | grep -q "already exists"; then
        echo "ℹ️  User already exists, continuing..."
    else
        echo "❌ Failed to create user: $RESPONSE"
        exit 1
    fi
else
    echo "✅ User created successfully"
fi

# Now promote to admin via database
echo "🎯 Promoting user to admin..."
docker compose exec -T postgres psql -U portfolio -d portfolio_db -c \
    "UPDATE users SET role = 'admin' WHERE email = '$EMAIL';" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ User promoted to admin successfully!"
else
    # If the update fails, try using the promote_to_admin function if it exists
    docker compose exec -T postgres psql -U portfolio -d portfolio_db -c \
        "SELECT promote_to_admin('$EMAIL');" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ User promoted to admin successfully!"
    else
        echo "⚠️  Could not promote user to admin automatically"
        echo "   You may need to do this manually in the database"
    fi
fi

echo ""
echo "🎉 Admin user ready!"
echo ""
echo "📱 Login at: http://localhost:$(grep FRONTEND_PORT .env | cut -d= -f2)"
echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo ""
echo "💡 Tip: You can now login and access the admin panel!"