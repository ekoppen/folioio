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

# Copy ALL database migrations automatically
echo "📊 Copying database migrations..."
MIGRATIONS_COPIED=0

# Check both possible migration directories
for migrations_dir in "local-backend/src/migrations" "supabase/migrations"; do
    if [ -d "$migrations_dir" ]; then
        echo "  📂 Found migrations in: $migrations_dir"
        for migration in "$migrations_dir"/*.sql; do
            if [ -f "$migration" ]; then
                migration_name=$(basename "$migration")
                cp "$migration" "$DEPLOY_DIR/postgres-config/"
                echo "  ✅ Copied: $migration_name"
                MIGRATIONS_COPIED=$((MIGRATIONS_COPIED + 1))
            fi
        done
    fi
done

if [ $MIGRATIONS_COPIED -gt 0 ]; then
    echo "📦 Total migrations copied: $MIGRATIONS_COPIED"
else
    echo "⚠️  No migrations found in local-backend/src/migrations or supabase/migrations"
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

echo "🔌 Port allocation:"
echo "  Frontend: $PORT"
echo "  MinIO Console: $MINIO_CONSOLE_PORT"

# Function to find next available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while [ $port -lt 65535 ]; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    
    # If no port found, return the original + 1000 as fallback
    echo $((start_port + 1000))
}

# Export ALL variables for Docker Compose
export CONTAINER_NAME=$SITE_NAME
export FRONTEND_PORT=$PORT

# Find available MinIO console port (starting from PORT + 1000, then scan upward)
MINIO_CONSOLE_PORT=$(find_available_port $((PORT + 1000)))
export MINIO_CONSOLE_PORT

# Export Vite variables for build
export VITE_BACKEND_TYPE=local
export VITE_LOCAL_API_URL=/api

# Create .env file in deployment directory with correct variable names
cat > .env << EOF
# Docker Compose variables
CONTAINER_NAME=$SITE_NAME
FRONTEND_PORT=$PORT
MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT

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

# Create data directories for bind mounts
echo "🔧 Creating data directories for bind mounts..."
mkdir -p data/postgres data/minio
echo "✅ Data directories created"

# Start the stack
echo "🐳 Starting Docker stack..."
docker compose down 2>/dev/null
docker compose up -d --build

# Debug: Check environment variables
echo "🔍 Checking environment variables..."
echo "Database password in .env: $(grep DATABASE_PASSWORD .env)"
echo "API server sees: $(docker compose exec -T api-server env | grep DATABASE_PASSWORD || echo 'NOT FOUND')"
echo "Postgres sees: $(docker compose exec -T postgres env | grep POSTGRES_PASSWORD || echo 'NOT FOUND')"

# Bind mounts don't need permission fixes on macOS
echo "✅ Bind mounts ready - no permission setup needed on macOS"

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

# Promote to admin (with retry logic)
echo "🔑 Promoting user to admin..."
for i in {1..5}; do
    if docker compose exec -T postgres psql -U postgres -d portfolio_db -c \
        "UPDATE profiles SET role = 'admin' WHERE email = '$ADMIN_EMAIL';" 2>/dev/null; then
        echo "✅ User promoted to admin successfully"
        break
    else
        echo "⏳ Attempt $i/5: Waiting for user to be created..."
        sleep 2
    fi
done

# Verify admin status
ADMIN_CHECK=$(docker compose exec -T postgres psql -U postgres -d portfolio_db -t -c \
    "SELECT role FROM profiles WHERE email = '$ADMIN_EMAIL';" 2>/dev/null | tr -d ' ')
    
if [ "$ADMIN_CHECK" = "admin" ]; then
    echo "✅ Admin role verified"
else
    echo "⚠️  Admin role not set. You can manually set it with:"
    echo "   docker compose exec postgres psql -U postgres -d portfolio_db -c \\"
    echo "     \"UPDATE profiles SET role = 'admin' WHERE email = '$ADMIN_EMAIL';\""
fi

# Create README with deployment information
echo "📝 Creating README with deployment info..."
cat > README.md << EOF
# $SITE_NAME Deployment

This is a deployed instance of the portfolio site.

## Access URLs

- **Site**: http://localhost:$PORT
- **MinIO Console**: http://localhost:$MINIO_CONSOLE_PORT

## Default Credentials

### Admin Login
- **Email**: $ADMIN_EMAIL
- **Password**: $ADMIN_PASSWORD

### MinIO Login
- **Username**: $MINIO_ACCESS_KEY
- **Password**: $MINIO_SECRET_KEY

## Docker Commands

\`\`\`bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Start services
docker compose up -d

# Restart services
docker compose restart

# Check status
docker compose ps
\`\`\`

## Database Access

If you need to access the database directly:

\`\`\`bash
docker compose exec postgres psql -U postgres -d portfolio_db
\`\`\`

## Troubleshooting

If the admin user doesn't work, you can create a new one:

\`\`\`bash
# Set admin role for existing user
docker compose exec postgres psql -U postgres -d portfolio_db -c \\
  "UPDATE profiles SET role = 'admin' WHERE email = '$ADMIN_EMAIL';"
\`\`\`

## Notes

- All data is stored in Docker volumes
- The deployment uses local storage (MinIO) for media files
- Database: PostgreSQL with portfolio_db database
- API runs on port 3000 internally
- Frontend is served via Nginx

Generated on: $(date)
EOF

echo "✅ README.md created in deployment directory"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Site URL: http://localhost:$PORT"
echo "🗄️  MinIO Console: http://localhost:$MINIO_CONSOLE_PORT"
echo "🔐 Admin Login:"
echo "   📧 Email: $ADMIN_EMAIL"
echo "   🔑 Password: $ADMIN_PASSWORD"
echo ""
echo "🔑 MinIO Login:"
echo "   👤 Username: $MINIO_ACCESS_KEY"
echo "   🔒 Password: $MINIO_SECRET_KEY"
echo ""
echo "🔧 Useful commands:"
echo "   cd $DEPLOY_DIR"
echo "   docker compose logs -f     # View logs"
echo "   docker compose down        # Stop services"
echo "   docker compose up -d       # Start services"
echo ""