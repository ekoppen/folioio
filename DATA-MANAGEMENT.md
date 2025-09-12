# Data Management & Backup Guide

## Data Storage Structure

As of the latest update, the portfolio system uses **bind-mounted directories** instead of Docker volumes for better data management and backup capabilities.

### Data Directory Structure

```
deployment-name/
├── data/
│   ├── postgres/          # PostgreSQL database files
│   └── minio/             # MinIO file storage
├── .env                   # Environment configuration
└── docker-compose.yml     # Container configuration
```

## Benefits of Bind Mounts

### ✅ **Easy Backups**
- Direct access to database files
- Simple folder copy/rsync operations
- No need for Docker volume commands

### ✅ **Data Persistence**
- Data survives container rebuilds
- Admin accounts persist across updates
- No more lost data during deployments

### ✅ **Portable Deployments**
- Easy migration between servers
- Simple data replication
- Development/staging synchronization

## Backup Strategies

### 1. **Simple Folder Backup**
```bash
# Backup entire data directory
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz data/

# Or use rsync for incremental backups
rsync -av data/ /backup/location/data/
```

### 2. **Live Database Backup**
```bash
# While containers are running
docker exec deployment-db pg_dump -U postgres portfolio_db > backup.sql
```

### 3. **Full System Backup**
```bash
# Stop containers
docker compose down

# Backup everything
tar -czf full-backup-$(date +%Y%m%d).tar.gz data/ .env docker-compose.yml

# Restart containers
docker compose up -d
```

## Recovery Procedures

### **Restore from Backup**
```bash
# Stop containers
docker compose down

# Restore data
tar -xzf backup-file.tar.gz

# Start containers
docker compose up -d
```

### **Migrate to New Server**
```bash
# On old server
tar -czf migration.tar.gz data/ .env

# On new server
tar -xzf migration.tar.gz
docker compose up -d
```

## Admin Account Management

### **Create Admin Account** (if needed)
```sql
-- Connect to database
docker exec -it deployment-db psql -U postgres -d portfolio_db

-- Create admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data) 
VALUES ('admin@example.com', crypt('your-password', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}');

-- Get user ID and create profile
INSERT INTO profiles (user_id, email, full_name, role) 
SELECT id, 'admin@example.com', 'Admin User', 'admin' 
FROM auth.users WHERE email = 'admin@example.com';
```

## Monitoring & Maintenance

### **Check Data Usage**
```bash
du -sh data/postgres data/minio
```

### **Database Health Check**
```bash
docker exec deployment-db pg_isready -U postgres -d portfolio_db
```

### **Log Files**
```bash
# View container logs
docker compose logs -f

# View specific service
docker compose logs -f postgres
```

## Production Recommendations

### **Automated Backups**
Set up cron jobs for regular backups:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### **Backup Retention**
- Keep daily backups for 7 days
- Keep weekly backups for 1 month  
- Keep monthly backups for 1 year

### **Monitoring**
- Monitor disk usage for data directories
- Set up alerts for database connection failures
- Track backup success/failure

## Troubleshooting

### **Permission Issues**
```bash
# Fix ownership if needed
sudo chown -R 999:999 data/postgres
sudo chown -R 1000:1000 data/minio
```

### **Corrupted Database**
```bash
# Stop container
docker compose stop postgres

# Check database integrity
docker run --rm -v $(pwd)/data/postgres:/var/lib/postgresql/data postgres:15-alpine pg_ctl -D /var/lib/postgresql/data status

# Restore from backup if needed
```

### **Lost Admin Access**
Use the admin account creation SQL commands above, or restore from a backup with known admin credentials.