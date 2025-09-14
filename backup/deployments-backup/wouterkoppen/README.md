# wouterkoppen Deployment

This is a deployed instance of the portfolio site.

## Access URLs

- **Site**: http://localhost:7010
- **MinIO Console**: http://localhost:8010

## Default Credentials

### Admin Login
- **Email**: admin@wouterkoppen.local
- **Password**: admin123

### MinIO Login
- **Username**: adminfOSZNfu7
- **Password**: 4ulOEa0h8uM1haPoxistLRpyY6YMTdPO

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
  "UPDATE profiles SET role = 'admin' WHERE email = 'admin@wouterkoppen.local';"
```

## Notes

- All data is stored in Docker volumes
- The deployment uses local storage (MinIO) for media files
- Database: PostgreSQL with portfolio_db database
- API runs on port 3000 internally
- Frontend is served via Nginx

Generated on: Fri Sep 12 20:54:54 CEST 2025
