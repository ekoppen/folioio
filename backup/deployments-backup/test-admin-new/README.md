# test-admin-new Deployment

This is a deployed instance of the portfolio site.

## Access URLs

- **Site**: http://localhost:7020
- **MinIO Console**: http://localhost:8020

## Default Credentials

### Admin Login
- **Email**: admin@test-admin-new.local
- **Password**: admin123

### MinIO Login
- **Username**: admin0TJCdYue
- **Password**: whEeo3Pq9mR5D24G8Axoi1Ti8ITAZMkl

## Docker Commands

```bash
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
```

## Database Access

If you need to access the database directly:

```bash
docker compose exec postgres psql -U postgres -d portfolio_db
```

## Troubleshooting

If the admin user doesn't work, you can create a new one:

```bash
# Set admin role for existing user
docker compose exec postgres psql -U postgres -d portfolio_db -c \
  "UPDATE profiles SET role = 'admin' WHERE email = 'admin@test-admin-new.local';"
```

## Notes

- All data is stored in Docker volumes
- The deployment uses local storage (MinIO) for media files
- Database: PostgreSQL with portfolio_db database
- API runs on port 3000 internally
- Frontend is served via Nginx

Generated on: Sun Sep 14 13:06:51 CEST 2025
