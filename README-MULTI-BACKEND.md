# Multi-Backend Portfolio Deployment System

This portfolio system now supports both **Supabase** and **Cloudbox** as backend providers, allowing you to choose the best solution for each deployment.

## Quick Start

### Deploy with Supabase
```bash
./deploy-new-site.sh client1 3001 supabase https://xyz.supabase.co your-anon-key project-id
```

### Deploy with Cloudbox  
```bash
./deploy-new-site.sh client2 3002 cloudbox https://cloudbox.doorkoppen.nl your-api-key project-id
```

## Management Commands

```bash
# List all deployments
./manage-deployments.sh list

# Deploy new site
./manage-deployments.sh deploy <name> <port> <backend-type> <url> <key> <project-id>

# Manage existing deployments
./manage-deployments.sh start|stop|restart|logs|update|remove <name>

# Show system status
./manage-deployments.sh status
```

## Backend Features

| Feature | Supabase | Cloudbox |
|---------|----------|----------|
| Authentication | ✅ | ✅ |
| Database | ✅ | ✅ |
| File Storage | ✅ | ✅ |
| Real-time | ✅ | ⚠️ |
| Edge Functions | ✅ | ✅ (Scripts) |
| Auto Schema Setup | ✅ | ✅ |

## Architecture

The system uses a **Backend Adapter Pattern** that provides a unified interface regardless of the backend:

```typescript
// Same code works with both backends
const { data, error } = await backend.from('albums').select('*');
```

## File Structure

```
backends/
├── shared-functions.sh     # Common deployment utilities
├── supabase-deploy.sh     # Supabase-specific deployment
└── cloudbox-deploy.sh     # Cloudbox-specific deployment

src/lib/backend/
├── types.ts               # Backend interface definitions
├── supabase-adapter.ts    # Supabase implementation
├── cloudbox-adapter.ts    # Cloudbox implementation
└── client.ts              # Unified backend client
```

## Configuration

Each deployment gets its own backend configuration that's automatically detected at runtime based on available environment variables or deployment settings.

The system maintains **100% backward compatibility** with existing Supabase deployments while enabling new Cloudbox deployments.