# Nginx Proxy Manager Setup voor Portfolio Sites

## Voor elke deployment heb je 2 proxy hosts nodig:

### 1. Frontend Proxy Host
- **Domain Names**: `www.wouterkoppen.com` (of jouw domein)
- **Scheme**: `http`
- **Forward Hostname / IP**: `127.0.0.1` of `localhost`
- **Forward Port**: `3040` (de frontend port die je hebt gekozen)
- **Block Common Exploits**: ✓
- **Websockets Support**: ✓ (voor live updates)
- **SSL Certificate**: Request a new SSL certificate with Let's Encrypt

### 2. API Proxy Host
- **Domain Names**: `api.wouterkoppen.com` (api subdomain van je domein)
- **Scheme**: `http`
- **Forward Hostname / IP**: `127.0.0.1` of `localhost`
- **Forward Port**: `7149` (frontend port + 139)
- **Block Common Exploits**: ✓
- **Websockets Support**: ✓
- **SSL Certificate**: Request a new SSL certificate with Let's Encrypt

### Custom Nginx Configuration voor API (onder Advanced tab):
```nginx
# Add CORS headers
add_header 'Access-Control-Allow-Origin' '$http_origin' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;

# Handle preflight requests
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain charset=UTF-8';
    add_header 'Content-Length' 0;
    return 204;
}
```

## Port Mapping Overzicht

Als je frontend port = 3040, dan:
- API port = 3040 + 139 = 7149
- Database port = 3040 + 1000 = 4040
- Storage port = 3040 + 2000 = 5040
- Storage console = 3040 + 2001 = 5041

## DNS Setup

Zorg ervoor dat beide domeinen naar je server wijzen:
- `www.wouterkoppen.com` → Je server IP
- `api.wouterkoppen.com` → Je server IP

## Deployment Command

```bash
./deploy-new-site.sh www.wouterkoppen.com 3040 local
```

Het script zal automatisch:
1. Detecteren dat het een domein is
2. API URL instellen als `https://api.wouterkoppen.com`
3. CORS configureren voor cross-domain requests
4. Alles klaarzetten voor HTTPS via Nginx Proxy Manager