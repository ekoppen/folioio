# 🚀 Deployment Guide

## Multiple Deployment Support

This project supports multiple deployments, each with its own configuration and admin account management.

### Deployment Structure

```
backup/deployments-backup/
├── dev-test/           # Development testing deployment
├── folioio/           # Main production deployment
├── test-admin-new/    # New admin features testing
└── wouterkoppen/      # Custom client deployment
```

### Creating Admin Account per Deployment

Each deployment folder contains its own `create-admin.js` script:

```bash
# Navigate to specific deployment
cd backup/deployments-backup/folioio

# Create admin account for this deployment
npm run create-admin
# OR
node create-admin.js
```

### Requirements per Deployment

Each deployment needs:
- ✅ Local backend running (`npm run backend` or Docker)
- ✅ Database migrated and accessible
- ✅ Environment variables in `local-backend/.env`
- ✅ Network access to database

### Environment Variables

Each deployment should have its own `.env` file in `local-backend/.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio
DB_USER=postgres
DB_PASSWORD=your_password

# Optional: Site URL for emails
SITE_URL=https://yourdomain.com
```

### Deployment Workflow

1. **Setup deployment folder**:
   ```bash
   cd backup/deployments-backup/your-deployment
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp local-backend/.env.example local-backend/.env
   # Edit .env with your settings
   ```

4. **Start backend** (if not using Docker):
   ```bash
   cd local-backend
   npm install
   npm start
   ```

5. **Run migrations**:
   ```bash
   # Backend will auto-migrate on startup
   ```

6. **Create admin account**:
   ```bash
   npm run create-admin
   ```

7. **Build and start**:
   ```bash
   npm run build
   npm run preview
   # OR for development
   npm run dev
   ```

### Docker Deployment

Each deployment can use Docker Compose:

```bash
cd backup/deployments-backup/your-deployment
docker-compose up -d
```

Then create admin account:
```bash
npm run create-admin
```

### Multiple Domains

For multiple domains, each deployment can have different:
- Database connections
- Email configurations
- Site URLs
- Admin accounts
- Content/styling

This allows for:
- 🏢 Client-specific deployments
- 🧪 Testing/staging environments
- 🌍 Multi-language sites
- 🎨 Different designs per deployment