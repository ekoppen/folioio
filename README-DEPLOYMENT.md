# Portfolio App - Multi-Deployment Guide

Deze guide helpt je om meerdere portfolio websites te deployen, elk met hun eigen Supabase project.

## Vereisten

- Docker & Docker Compose geïnstalleerd
- Meerdere Supabase projecten aangemaakt
- Basis Linux/Unix command line kennis

## Stap 1: Maak een nieuw Supabase project

Voor elke portfolio website heb je een apart Supabase project nodig:

1. Ga naar [supabase.com](https://supabase.com)
2. Maak een nieuw project aan
3. Ga naar Settings > API
4. Noteer de volgende gegevens:
   - Project URL (bijv. `https://xyz.supabase.co`)
   - Anon/Public key
   - Project ID (bijv. `xyz`)

## Stap 2: Database Schema kopiëren

Kopieer de database schema van je oorspronkelijke project naar het nieuwe project:

1. Ga naar je oorspronkelijke Supabase project
2. Ga naar SQL Editor
3. Kopieer alle migrations uit `supabase/migrations/`
4. Voer ze uit in je nieuwe project

Of gebruik Supabase CLI:
```bash
# Export schema from original project
supabase db dump --project-id lpowueiolmezwzueljwx > schema.sql

# Import to new project
supabase db reset --project-id YOUR_NEW_PROJECT_ID
psql -h db.YOUR_NEW_PROJECT_ID.supabase.co -U postgres -f schema.sql
```

## Stap 3: Deploy een nieuwe site

Gebruik het meegeleverde script:

```bash
chmod +x deploy-new-site.sh

./deploy-new-site.sh "client1" 3001 "https://xyz.supabase.co" "your-anon-key" "xyz"
```

Parameters:
- `client1`: Naam voor deze deployment
- `3001`: Poort waarop de site draait
- `https://xyz.supabase.co`: Supabase project URL
- `your-anon-key`: Supabase anon key
- `xyz`: Supabase project ID

## Stap 4: Verificatie

Na deployment:
1. Ga naar `http://localhost:3001` (of je gekozen poort)
2. Test de admin functionaliteit op `/admin`
3. Controleer of data wordt opgeslagen in het juiste Supabase project

## Meerdere sites beheren

### Overzicht van actieve deployments:
```bash
docker ps
```

### Logs bekijken:
```bash
cd deployments/client1
docker-compose logs -f
```

### Site stoppen:
```bash
cd deployments/client1
docker-compose down
```

### Site herstarten:
```bash
cd deployments/client1
docker-compose restart
```

### Site updaten:
```bash
cd deployments/client1
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Productie Setup

Voor productie gebruik:

### 1. Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/portfolio-sites
server {
    listen 80;
    server_name client1.yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name client2.yourdomain.com;
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. SSL Certificaten (Let's Encrypt)
```bash
sudo certbot --nginx -d client1.yourdomain.com -d client2.yourdomain.com
```

### 3. Automatische Backups
```bash
# Crontab entry voor dagelijkse Supabase backups
0 2 * * * supabase db dump --project-id xyz > /backups/client1-$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Container start niet:
```bash
docker-compose logs
```

### Poort al in gebruik:
```bash
sudo netstat -tulpn | grep :3001
sudo kill -9 PID
```

### Database connectie problemen:
- Controleer Supabase project URL en keys
- Verifieer of RLS policies correct zijn gekopieerd
- Check Supabase project status

### Performance optimalisatie:
- Gebruik Docker volumes voor persistente data
- Implementeer Redis voor caching
- Monitor resource gebruik met `docker stats`

## Voorbeeld Directory Structuur

```
portfolio-app/
├── deployments/
│   ├── client1/
│   │   ├── docker-compose.yml
│   │   ├── src/config/supabase-config.ts
│   │   └── [alle app bestanden]
│   ├── client2/
│   └── client3/
├── deploy-new-site.sh
└── README-DEPLOYMENT.md
```

## Ondersteuning

Voor vragen of problemen:
1. Check de logs: `docker-compose logs`
2. Verifieer Supabase connectie in browser console
3. Test API endpoints handmatig

Happy deploying! 🚀