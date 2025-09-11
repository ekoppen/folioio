#!/bin/bash

# Simple deployment script for portfolio sites
# Usage: ./deploy-simple.sh <site-name> <port>

SITE_NAME=$1
PORT=$2

if [ $# -lt 2 ]; then
    echo "Usage: $0 <site-name> <port>"
    echo "Example: $0 wouterkoppen 8080"
    exit 1
fi

echo "🚀 Deploying $SITE_NAME on port $PORT"

# Create deployment directory
DEPLOY_DIR="deployments/$SITE_NAME"
mkdir -p "$DEPLOY_DIR"

# Copy all necessary files
echo "📦 Copying files..."
cp -r src public index.html package*.json vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js "$DEPLOY_DIR/" 2>/dev/null
cp -r local-backend "$DEPLOY_DIR/"
cp docker-compose.simple.yml "$DEPLOY_DIR/docker-compose.yml"
cp nginx-simple.conf "$DEPLOY_DIR/"

# Create postgres init directory
mkdir -p "$DEPLOY_DIR/postgres-config"

# Copy schema migration
if [ -f "local-backend/src/migrations/001_init_schema.sql" ]; then
    cp local-backend/src/migrations/001_init_schema.sql "$DEPLOY_DIR/postgres-config/"
fi

# Copy URL encoding fix if it exists
if [ -f "local-backend/src/migrations/002_fix_url_encoding.sql" ]; then
    cp local-backend/src/migrations/002_fix_url_encoding.sql "$DEPLOY_DIR/postgres-config/"
fi

# Change to deployment directory
cd "$DEPLOY_DIR"

# Generate passwords and export them
export DATABASE_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
export MINIO_ACCESS_KEY="admin$(openssl rand -base64 8 | tr -d "=+/" | cut -c1-8)"
export MINIO_SECRET_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
export JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

echo "🔐 Generated passwords:"
echo "  Database: $DATABASE_PASSWORD"
echo "  MinIO Key: $MINIO_ACCESS_KEY"

# Export ALL variables for Docker Compose
export CONTAINER_NAME=$SITE_NAME
export FRONTEND_PORT=$PORT

# Export Vite variables for build
export VITE_BACKEND_TYPE=local
export VITE_LOCAL_API_URL=/api

# Create .env file in deployment directory with correct variable names
cat > .env << EOF
# Docker Compose variables
CONTAINER_NAME=$SITE_NAME
FRONTEND_PORT=$PORT

# API Backend variables (use postgres superuser to avoid user creation issues)
DATABASE_USER=postgres
DATABASE_PASSWORD=$DATABASE_PASSWORD
MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY
MINIO_SECRET_KEY=$MINIO_SECRET_KEY
JWT_SECRET=$JWT_SECRET

# PostgreSQL variables (what postgres container expects)
POSTGRES_PASSWORD=$DATABASE_PASSWORD
POSTGRES_USER=postgres
POSTGRES_DB=portfolio_db

# MinIO variables (what minio container expects)
MINIO_ROOT_USER=$MINIO_ACCESS_KEY
MINIO_ROOT_PASSWORD=$MINIO_SECRET_KEY

# Vite environment variables for frontend build
VITE_BACKEND_TYPE=local
VITE_LOCAL_API_URL=/api
EOF

echo "📝 Created .env file in deployment directory"

# Build the frontend with local backend configuration
echo "🔨 Building frontend with local backend..."
npm install
npm run build

# Start the stack
echo "🐳 Starting Docker stack..."
docker compose down 2>/dev/null
docker compose up -d --build

# Debug: Check environment variables
echo "🔍 Checking environment variables..."
echo "Database password in .env: $(grep DATABASE_PASSWORD .env)"
echo "API server sees: $(docker compose exec -T api-server env | grep DATABASE_PASSWORD || echo 'NOT FOUND')"
echo "Postgres sees: $(docker compose exec -T postgres env | grep POSTGRES_PASSWORD || echo 'NOT FOUND')"

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check if API server is running
echo "🔍 Checking API server status..."
docker compose logs api-server | tail -10

# Create default admin user
echo "👤 Creating default admin user..."
ADMIN_EMAIL="admin@$SITE_NAME.local"
ADMIN_PASSWORD="admin123"

# Create user via API
USER_RESPONSE=$(docker compose exec -T nginx sh -c "curl -s -X POST http://api-server:3000/auth/signup \
    -H 'Content-Type: application/json' \
    -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"full_name\":\"Site Administrator\"}'")

if echo "$USER_RESPONSE" | grep -q "error"; then
    if echo "$USER_RESPONSE" | grep -q "already exists"; then
        echo "ℹ️  Admin user already exists"
    else
        echo "⚠️  Could not create admin user automatically"
    fi
else
    echo "✅ Admin user created"
fi

# Promote to admin
docker compose exec -T postgres psql -U postgres -d portfolio_db -c \
    "UPDATE profiles SET role = 'admin' WHERE email = '$ADMIN_EMAIL';" > /dev/null 2>&1

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Site URL: http://localhost:$PORT"
echo "🔐 Admin Login:"
echo "   📧 Email: $ADMIN_EMAIL"
echo "   🔑 Password: $ADMIN_PASSWORD"
echo ""
echo "🔧 Useful commands:"
echo "   cd $DEPLOY_DIR"
echo "   docker compose logs -f     # View logs"
echo "   docker compose down        # Stop services"
echo "   docker compose up -d       # Start services"
echo ""