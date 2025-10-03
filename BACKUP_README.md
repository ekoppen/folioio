# Portfolio Deployment Backup System

Complete backup and restore system voor je portfolio deployments met ondersteuning voor remote backups (NAS).

## 📋 Overzicht

Het backup systeem bestaat uit 4 scripts:
- **backup-deployment.sh** - Maakt backups van deployments
- **list-backups.sh** - Bekijk en beheer backups
- **restore-deployment.sh** - Herstel backups
- **automated-backup.sh** - Automatische backups (cron)

## 🚀 Quick Start

### 1. Basis backup maken
```bash
# Backup van één deployment
./backup-deployment.sh folioio

# Backup van alle deployments
./backup-deployment.sh --all

# Test eerst met dry-run
./backup-deployment.sh folioio --dry-run
```

### 2. Backups bekijken
```bash
# Alle backups tonen
./list-backups.sh

# Backups van specifieke deployment
./list-backups.sh folioio

# Met verificatie en details
./list-backups.sh folioio --verify --details
```

### 3. Backup herstellen
```bash
# Laatste backup herstellen
./restore-deployment.sh folioio latest

# Specifieke backup herstellen
./restore-deployment.sh folioio 20251003-124317

# Test eerst met dry-run
./restore-deployment.sh folioio latest --dry-run
```

## 🔧 Remote Backup Configuratie (NAS)

### Stap 1: Configuratiebestand aanmaken
```bash
# Kopieer het voorbeeld configuratiebestand
cp backup.config.example backup.config

# Bewerk de configuratie
nano backup.config  # of gebruik je favoriete editor
```

### Stap 2: NAS instellingen configureren

#### Optie A: NAS via SSH (met custom poort)
```bash
# In backup.config:
REMOTE_BACKUP_ENABLED=true
REMOTE_BACKUP_DEST="user@nas.local:/volume1/backups/folioio"
REMOTE_SSH_PORT=2222  # Pas aan naar jouw SSH poort
REMOTE_SSH_KEY="$HOME/.ssh/nas_backup_key"  # Optioneel
REMOTE_BACKUP_COMPRESS=true
REMOTE_BACKUP_VERIFY=true
```

#### Optie B: Gemounte NAS
```bash
# In backup.config:
REMOTE_BACKUP_ENABLED=true
REMOTE_BACKUP_DEST="/Volumes/NAS/backups/folioio"
REMOTE_BACKUP_COMPRESS=true
```

#### Optie C: NAS via IP adres
```bash
# In backup.config:
REMOTE_BACKUP_ENABLED=true
REMOTE_BACKUP_DEST="admin@192.168.1.100:/backups/folioio"
REMOTE_SSH_PORT=22
REMOTE_BACKUP_COMPRESS=true
```

### Stap 3: SSH Key Setup (optioneel maar aanbevolen)
```bash
# Genereer SSH key als je die nog niet hebt
ssh-keygen -t ed25519 -f ~/.ssh/nas_backup_key -C "backup@portfolio"

# Kopieer de key naar je NAS
ssh-copy-id -i ~/.ssh/nas_backup_key.pub -p 2222 user@nas.local

# Test de verbinding
ssh -i ~/.ssh/nas_backup_key -p 2222 user@nas.local
```

### Stap 4: Test de remote backup
```bash
# Test met dry-run
./backup-deployment.sh folioio --dry-run

# Als het goed lijkt, maak een echte backup
./backup-deployment.sh folioio
```

## 📊 Backup Opties

### Backup Scripts Opties
```bash
# Quick mode (alleen SQL dump)
./backup-deployment.sh folioio --quick

# Met compressie
./backup-deployment.sh folioio --compress

# Incremental backup (sneller voor grote datasets)
./backup-deployment.sh folioio --incremental

# Stop containers tijdens backup (voor consistentie)
./backup-deployment.sh folioio --stop

# Backup naar remote (zonder config file)
./backup-deployment.sh folioio --remote user@nas:/backups
```

### Backup Wat bevat een backup?
- ✅ PostgreSQL data directory (volledige database)
- ✅ SQL dump van de database
- ✅ MinIO object storage (geüploade bestanden)
- ✅ .env configuratie
- ✅ docker-compose.yml
- ✅ Metadata met checksums

## ⏰ Automatische Backups (Cron)

### Setup Cron Job

```bash
# Open crontab editor
crontab -e

# Voeg één van deze regels toe:

# Dagelijkse backup om 02:00
0 2 * * * /pad/naar/automated-backup.sh

# Twee keer per dag (02:00 en 14:00)
0 2,14 * * * /pad/naar/automated-backup.sh

# Wekelijks op zondag om 03:00
0 3 * * 0 /pad/naar/automated-backup.sh
```

### Cron Job met Notificaties
```bash
# In backup.config:
EMAIL_NOTIFICATIONS=true
EMAIL_TO="jouw@email.com"
EMAIL_FROM="backup@localhost"
```

## 🗑️ Backup Cleanup

### Automatische cleanup
```bash
# In backup.config:
BACKUP_RETENTION_DAYS=30  # Verwijder backups ouder dan 30 dagen
BACKUP_MIN_KEEP=3         # Houd altijd minimaal 3 backups
```

### Handmatige cleanup
```bash
# Verwijder backups ouder dan 30 dagen
./list-backups.sh --cleanup 30

# Voor specifieke deployment
./list-backups.sh folioio --cleanup 30
```

## 🔐 Beveiliging

### SSH Key Permissions
```bash
# Zorg voor correcte permissies
chmod 600 ~/.ssh/nas_backup_key
chmod 644 ~/.ssh/nas_backup_key.pub
```

### .gitignore
Het `backup.config` bestand wordt automatisch genegeerd door git (bevat mogelijk gevoelige info).

## 📝 Voorbeeld Configuratie

```bash
# backup.config - Complete voorbeeld voor Synology NAS

# Remote backup naar Synology NAS via SSH
REMOTE_BACKUP_ENABLED=true
REMOTE_BACKUP_DEST="admin@192.168.1.100:/volume1/backups/folioio"
REMOTE_SSH_PORT=22
REMOTE_SSH_KEY="$HOME/.ssh/nas_backup_key"
REMOTE_BACKUP_COMPRESS=true
REMOTE_BACKUP_VERIFY=true

# Lokale backup instellingen
LOCAL_BACKUP_ROOT="deployment-backups"
BACKUP_RETENTION_DAYS=30
BACKUP_MIN_KEEP=3

# Performance
USE_INCREMENTAL=true
STOP_CONTAINERS_DURING_BACKUP=false

# Notificaties
EMAIL_NOTIFICATIONS=false
```

## 🔍 Troubleshooting

### Remote backup werkt niet
```bash
# Test SSH verbinding handmatig
ssh -i ~/.ssh/nas_backup_key -p 2222 user@nas.local

# Test rsync handmatig
rsync -avz -e "ssh -p 2222 -i ~/.ssh/nas_backup_key" \
  test.txt user@nas.local:/volume1/backups/

# Check SSH key permissions
ls -la ~/.ssh/nas_backup_key
```

### Disk space problemen
```bash
# Check beschikbare ruimte
df -h

# Check backup sizes
du -sh deployment-backups/*

# Run cleanup
./list-backups.sh --cleanup 30
```

### Container errors tijdens backup
```bash
# Gebruik --stop flag voor consistente backup
./backup-deployment.sh folioio --stop

# Of configureer in backup.config:
STOP_CONTAINERS_DURING_BACKUP=true
```

## 📖 Meer Informatie

### Backup locaties
- **Lokaal**: `deployment-backups/[deployment]/[timestamp]/`
- **Remote (NAS)**: `$REMOTE_BACKUP_DEST/[deployment]/[timestamp]/`
- **Logs**: `backup-automation.log` (voor automated backups)

### Backup formaat

**Lokaal**:
```
deployment-backups/
└── folioio/
    └── 20251003-124317/
        ├── data/
        │   ├── postgres/    # Database files
        │   └── minio/       # Uploaded files
        ├── database.sql     # SQL dump
        ├── .env
        ├── docker-compose.yml
        └── backup.meta      # Metadata met checksums
```

**Remote (NAS)**: Deployment naam wordt gebruikt als subdirectory
```
# Bij REMOTE_BACKUP_DEST="/volume1/backups/folioio"
/volume1/backups/folioio/
└── folioio/                      # Deployment naam
    └── 20251003-124317/          # Timestamp
        └── [alle backup bestanden]

# Of met compressie:
/volume1/backups/folioio/
└── folioio/                      # Deployment naam
    └── 20251003-124317.tar.gz    # Gecomprimeerde backup
```

### Handige commando's
```bash
# Bekijk log van laatste automated backup
tail -100 backup-automation.log

# Verifieer alle backups
./list-backups.sh --verify

# Bekijk backup details
./list-backups.sh folioio --details

# Test restore zonder changes
./restore-deployment.sh folioio latest --dry-run
```

## 🆘 Support

Voor vragen of problemen, check de script help:
```bash
./backup-deployment.sh --help
./list-backups.sh --help
./restore-deployment.sh --help
./automated-backup.sh --help
```
