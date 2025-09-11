# Local Installation Guide

This guide explains how to deploy the portfolio website locally using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Port 8080 available (or choose another port)
- For production: Nginx Proxy Manager or similar reverse proxy

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd folio-tmp
```

### 2. Run the Deployment Script

```bash
./deploy-simple.sh <site-name> <port>
```

Example:
```bash
./deploy-simple.sh myportfolio 8080
```

This script will:
- Generate secure passwords automatically
- Copy all necessary files to `deployments/<site-name>/`
- Build the frontend with local backend configuration
- Start all Docker containers (PostgreSQL, MinIO, API, Nginx)
- Create a default admin user

### 3. Access Your Site

After deployment completes, you'll see:
```
✅ Deployment complete!

🌐 Site URL: http://localhost:8080
🔐 Admin Login:
   📧 Email: admin@myportfolio.local
   🔑 Password: admin123
```

Open your browser and navigate to the provided URL.

## Architecture

The deployment creates a complete stack with:

- **Nginx**: Reverse proxy serving frontend and routing API calls
- **API Server**: Node.js backend handling all data operations
- **PostgreSQL**: Database for storing all content
- **MinIO**: S3-compatible storage for images and files

## Container Management

Navigate to your deployment directory:
```bash
cd deployments/<site-name>
```

### View Logs
```bash
docker compose logs -f          # All services
docker compose logs api-server  # API server only
docker compose logs postgres    # Database only
```

### Stop Services
```bash
docker compose down
```

### Start Services
```bash
docker compose up -d
```

### Remove Everything (Including Data)
```bash
docker compose down -v
```

## Deployment Management

### Update All Deployments
Update all existing deployments to the latest version:
```bash
./update-deployments.sh
```

This script will:
- Pull the latest code from the repository
- Update all deployments in the `deployments/` directory
- Preserve existing environment variables (passwords, etc.)
- Rebuild and restart all services
- Show a summary of successful/failed updates

### List All Deployments
View all deployments and their status:
```bash
./list-deployments.sh
```

Shows:
- Deployment names and paths
- Site URLs and MinIO console URLs
- Running status of each deployment
- Quick management commands

### Update a Single Deployment
To manually update just one deployment:
```bash
cd deployments/<site-name>
docker compose down
cd ../..
# Copy updated files manually, then:
cd deployments/<site-name>
npm install && npm run build
docker compose up -d --build
```

### Remove Deployments
Remove old or unwanted deployments safely:

**Remove single deployment:**
```bash
./remove-deployment.sh <site-name>
```

**Interactive cleanup (multiple deployments):**
```bash
./cleanup-deployments.sh
```

**Features:**
- Shows deployment details before removal
- Requires explicit confirmation ("DELETE" must be typed)
- Stops containers and removes volumes automatically
- Creates backup of environment file for reference
- Cleans up Docker resources
- Lists remaining deployments after removal

## Production Deployment with Domain

### 1. Deploy to Your Server

Copy the repository to your server and run:
```bash
./deploy-simple.sh <site-name> <port>
```

### 2. Configure Nginx Proxy Manager

In Nginx Proxy Manager, create a new Proxy Host:

**Details Tab:**
- Domain Names: `www.yourdomain.com`
- Scheme: `http`
- Forward Hostname/IP: `<server-ip>`
- Forward Port: `<port>`
- Enable: Cache Assets, Block Common Exploits, Websockets Support

**Custom Locations Tab:**

Add location for API:
- Define location: `/api/`
- Forward Hostname/IP: `<server-ip>`
- Forward Port: `<port>`

Add location for Storage:
- Define location: `/storage/`
- Forward Hostname/IP: `<server-ip>`
- Forward Port: `<port>`

**SSL Tab:**
- Request a new SSL Certificate with Let's Encrypt
- Force SSL: Yes

### 3. Alternative: Custom Nginx Configuration

If your Nginx Proxy Manager doesn't support custom locations properly, use the Advanced tab:

```nginx
location /api/ {
    proxy_pass http://<server-ip>:<port>/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /storage/ {
    proxy_pass http://<server-ip>:<port>/storage/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 500M;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
}
```

## MinIO Storage Management

### Access MinIO Interface

**Direct Console Access**: `http://localhost:<minio-console-port>`
- The console port is automatically found starting from `<main-port> + 1000`
- Script scans for next available port to avoid conflicts
- Example: If site runs on port 8080, MinIO console starts at 9080, 9081, etc.

**Alternative Access**: `http://localhost:<port>/storage/minio/ui/`
**Production Access**: `https://yourdomain.com/storage/minio/ui/`

**Login credentials** (found in deployment `.env` file):
```bash
cd deployments/<site-name>
cat .env | grep MINIO_ROOT_
```

- **Username**: Value of `MINIO_ROOT_USER`
- **Password**: Value of `MINIO_ROOT_PASSWORD`

### Upload Limits

The system is configured for large photo uploads:
- **Maximum file size**: 500MB per file
- **Timeout**: 10 minutes for uploads
- **Supported formats**: All image formats (JPG, PNG, TIFF, RAW, etc.)

### Storage Buckets

The system automatically creates these buckets:
- `gallery-images`: Portfolio gallery photos
- `slideshow-images`: Homepage slideshow images  
- `logos`: Site logos and branding
- `custom-fonts`: Custom font files
- `fotos`: General photo storage

## User Management

### Make a User Admin

```bash
cd deployments/<site-name>

# Update user role to admin
docker compose exec postgres psql -U postgres -d portfolio_db -c \
  "UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';"
```

### List All Users

```bash
docker compose exec postgres psql -U postgres -d portfolio_db -c \
  "SELECT email, role, created_at FROM profiles;"
```

### Create Additional Admin User

```bash
cd deployments/<site-name>

# Create user via API
docker compose exec nginx sh -c "curl -X POST http://api-server:3000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"newadmin@example.com\",\"password\":\"secure-password\",\"full_name\":\"Admin Name\"}'"

# Make them admin
docker compose exec postgres psql -U postgres -d portfolio_db -c \
  "UPDATE profiles SET role = 'admin' WHERE email = 'newadmin@example.com';"
```

## Troubleshooting

### Containers Won't Start

Check the logs:
```bash
docker compose logs
```

Common issues:
- Port already in use: Change the port in the deployment command
- Permission issues: Make sure the script is executable: `chmod +x deploy-simple.sh`

### Database Connection Issues

If you see "password authentication failed":
1. Stop all containers: `docker compose down -v`
2. Remove volumes: `docker volume prune -f`
3. Redeploy: `./deploy-simple.sh <site-name> <port>`

### API Returns 502 Error

This usually means the nginx proxy configuration is incorrect:
1. Check if API is running: `docker compose logs api-server`
2. Test API directly: `curl http://localhost:<port>/api/health`
3. Verify nginx proxy settings in Nginx Proxy Manager

### Can't Upload Images

Make sure you've configured the storage location in Nginx Proxy Manager:
- Location: `/storage/`
- Forward to the same host and port as your main site

### No Admin Button After Login

The account needs admin privileges:
```bash
docker compose exec postgres psql -U postgres -d portfolio_db -c \
  "UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';"
```

## Environment Variables

The deployment script automatically generates secure passwords. You can find them in:
```bash
cat deployments/<site-name>/.env
```

Important variables:
- `DATABASE_PASSWORD`: PostgreSQL password
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key
- `JWT_SECRET`: JWT signing secret

## Backup and Restore

### Backup Database

```bash
cd deployments/<site-name>
docker compose exec postgres pg_dump -U postgres portfolio_db > backup.sql
```

### Restore Database

```bash
cd deployments/<site-name>
docker compose exec -T postgres psql -U postgres portfolio_db < backup.sql
```

### Backup Storage

```bash
cd deployments/<site-name>
docker compose exec minio tar -czf /tmp/storage-backup.tar.gz /data
docker compose cp minio:/tmp/storage-backup.tar.gz ./storage-backup.tar.gz
```

## Security Considerations

1. **Change default admin password** immediately after first login
2. **Use strong passwords** for all user accounts
3. **Keep Docker and dependencies updated**
4. **Use HTTPS in production** (via Nginx Proxy Manager or similar)
5. **Restrict database access** - only expose ports that are necessary
6. **Regular backups** - automate database and storage backups

## Support

For issues or questions:
1. Check the logs first: `docker compose logs`
2. Verify all containers are running: `docker compose ps`
3. Ensure ports are not blocked by firewall
4. Check that you have sufficient disk space and memory

## License

[Your License Here]