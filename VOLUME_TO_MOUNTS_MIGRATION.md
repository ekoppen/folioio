# Migratie van Docker Volumes naar Gekoppelde Mappen

Dit document legt uit hoe je van Docker volumes naar gekoppelde mappen (host bind mounts) kunt overstappen voor betere controle over je data.

## Waarom overstappen?

**Voordelen van gekoppelde mappen:**
- ✅ Directe toegang tot bestanden vanaf de host
- ✅ Eenvoudiger backup en restore
- ✅ Betere performance op sommige systemen  
- ✅ Meer controle over data locatie
- ✅ Eenvoudiger debugging en monitoring

**Nadelen:**
- ⚠️ Afhankelijk van host filesystem permissions
- ⚠️ Moet zelf directory structuur beheren

## Stap 1: Backup je huidige data

Voordat je begint, maak een backup van je bestaande data:

```bash
# Ga naar je deployment directory
cd deployments/jouw-site-naam

# Stop de containers
docker compose down

# Backup database
docker run --rm -v $(docker volume ls -q | grep postgres):/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup MinIO data  
docker run --rm -v $(docker volume ls -q | grep minio):/data -v $(pwd):/backup alpine \
  tar czf /backup/minio-backup.tar.gz -C /data .

echo "✅ Backups created: postgres-backup.tar.gz en minio-backup.tar.gz"
```

## Stap 2: Gebruik de nieuwe docker-compose configuratie

Vervang je huidige `docker-compose.yml` met deze versie die gekoppelde mappen gebruikt:

```yaml
version: '3.8'

services:
  # Nginx reverse proxy - handles all incoming traffic
  nginx:
    image: nginx:alpine
    ports:
      - "${FRONTEND_PORT:-80}:80"
    volumes:
      - ./nginx-simple.conf:/etc/nginx/conf.d/default.conf:ro
      - ./dist:/usr/share/nginx/html:ro
    depends_on:
      - api-server
    networks:
      - portfolio-network
    restart: unless-stopped
    container_name: "${CONTAINER_NAME:-portfolio}-nginx"

  # API Backend
  api-server:
    build: ./local-backend
    expose:
      - "3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=portfolio_db
      - DATABASE_USER=postgres
      - MINIO_ENDPOINT=minio:9000
      - CORS_ORIGIN=*
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    container_name: "${CONTAINER_NAME:-portfolio}-api"

  # PostgreSQL Database - GEBRUIKT GEKOPPELDE MAP
  postgres:
    image: postgres:15-alpine
    env_file:
      - .env
    environment:
      - POSTGRES_DB=portfolio_db
      - POSTGRES_USER=postgres
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --locale=C
    volumes:
      # AANGEPAST: gekoppelde map in plaats van volume
      - ./data/postgres:/var/lib/postgresql/data
      - ./postgres-config:/docker-entrypoint-initdb.d
      - ./backups:/backups  # Extra: backup directory
    networks:
      - portfolio-network
    restart: unless-stopped
    container_name: "${CONTAINER_NAME:-portfolio}-db"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d portfolio_db"]
      interval: 5s
      timeout: 10s
      retries: 10
      start_period: 30s

  # MinIO Storage - GEBRUIKT GEKOPPELDE MAP
  minio:
    image: minio/minio:latest
    env_file:
      - .env
    ports:
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    volumes:
      # AANGEPAST: gekoppelde map in plaats van volume
      - ./data/minio:/data
      - ./backups:/backups  # Extra: backup directory
    command: server /data --console-address ":9001"
    networks:
      - portfolio-network
    restart: unless-stopped
    container_name: "${CONTAINER_NAME:-portfolio}-storage"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

# WEGGEHAALD: volumes sectie (niet meer nodig)
networks:
  portfolio-network:
    driver: bridge
```

## Stap 3: Maak de directory structuur

```bash
# Maak de benodigde directories
mkdir -p data/postgres data/minio backups logs

# Set juiste permissions voor PostgreSQL
sudo chown -R 999:999 data/postgres  # PostgreSQL user ID in container

# Set permissions voor MinIO
sudo chown -R 1001:1001 data/minio  # MinIO user ID in container

echo "✅ Directory structuur aangemaakt"
```

## Stap 4: Restore je data (als je backups hebt)

```bash
# Restore PostgreSQL data
if [ -f "postgres-backup.tar.gz" ]; then
    tar xzf postgres-backup.tar.gz -C data/postgres/
    sudo chown -R 999:999 data/postgres
    echo "✅ PostgreSQL data restored"
fi

# Restore MinIO data
if [ -f "minio-backup.tar.gz" ]; then
    tar xzf minio-backup.tar.gz -C data/minio/
    sudo chown -R 1001:1001 data/minio
    echo "✅ MinIO data restored"
fi
```

## Stap 5: Start met de nieuwe configuratie

```bash
# Start de containers
docker compose up -d

# Check of alles werkt
docker compose ps

# Test je site
curl -f http://localhost:${FRONTEND_PORT} || echo "Site nog niet beschikbaar, wacht even..."

echo "✅ Migratie naar gekoppelde mappen voltooid!"
```

## Stap 6: Ruim oude volumes op (optioneel)

**⚠️ Pas nadat je zeker weet dat alles werkt!**

```bash
# Lijst oude volumes
docker volume ls | grep $(basename $(pwd))

# Verwijder oude volumes (PAS OP: dit verwijdert de oude data definitief)
# docker volume rm $(docker volume ls -q | grep $(basename $(pwd)))
```

## Voordelen van de nieuwe setup

1. **Directe toegang**: Je kunt nu direct naar `data/postgres/` en `data/minio/` om je bestanden te bekijken
2. **Eenvoudige backups**: 
   ```bash
   # Backup alles
   tar czf site-backup-$(date +%Y%m%d).tar.gz data/ .env
   ```
3. **Monitoring**: Je kunt disk usage monitoren met gewone tools
4. **Migratie tussen servers**: Kopieer gewoon de `data/` directory

## Troubleshooting

**Permissions problemen:**
```bash
# Check permissions
ls -la data/

# Fix PostgreSQL permissions
sudo chown -R 999:999 data/postgres

# Fix MinIO permissions  
sudo chown -R 1001:1001 data/minio
```

**Container start niet:**
```bash
# Check logs
docker compose logs postgres
docker compose logs minio

# Reset data directory (verliest data!)
# rm -rf data/postgres/* data/minio/*
# docker compose up -d
```

**Database connectie problemen:**
```bash
# Test database connectie
docker compose exec postgres psql -U postgres -d portfolio_db -c "SELECT version();"
```

## Automatische update scripts aanpassing

De bestaande `update-deployments.sh` en `deploy-simple.sh` scripts werken nog steeds, maar je kunt ze aanpassen om ook directory permissions te checken:

```bash
# Voeg dit toe aan je update script na line 110:
echo "  🔧 Checking directory permissions..."
sudo chown -R 999:999 data/postgres 2>/dev/null || true
sudo chown -R 1001:1001 data/minio 2>/dev/null || true
```

## Script om automatisch te migreren

Je kunt dit script gebruiken om automatisch te migreren:

```bash
#!/bin/bash
# migrate-to-mounts.sh
echo "🔄 Migrating from volumes to bind mounts..."

# Backup, migrate, and restart
docker compose down
mkdir -p data/postgres data/minio backups
# ... kopieer bovenstaande stappen ...
docker compose up -d

echo "✅ Migration completed!"
```

Met deze setup heb je veel meer controle over je data en kun je eenvoudiger backups maken!