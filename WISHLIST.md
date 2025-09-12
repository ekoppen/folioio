# Portfolio System Wishlist & Feature Requests

## 🎯 High Priority Features

### 🔄 Bidirectionele Album/Storage Sync
**Status**: Requested  
**Priority**: High  
**Description**: Automatische detectie van nieuwe mappen in MinIO storage en converteren naar albums in database.

**Current Behavior**: 
- Albums → Storage: ✅ Werkt (album maken → folder wordt aangemaakt)
- Storage → Albums: ❌ Werkt niet (nieuwe folder → geen album detectie)

**Desired Behavior**:
- Nieuwe map met foto's in MinIO storage wordt automatisch gedetecteerd
- Systeem stelt voor om map te converteren naar album
- Bulk foto import vanuit storage folders
- Behoud admin controle over wat wel/niet wordt geïmporteerd

**Technical Requirements**:
- Storage scanning API endpoint (`/api/storage/sync-albums`)
- Album auto-creation met validatie
- Photo discovery & batch import
- Admin interface sync controls
- Conflict resolution voor duplicate namen

**Use Cases**:
1. Bulk upload: Veel foto's via FTP/file manager naar MinIO → auto-detect albums
2. Migration: Bestaande foto collecties importeren
3. External sync: Foto's van externe bronnen bulk importeren
4. Workflow efficiency: Fotografen kunnen direct folders uploaden

**Estimated Effort**: Medium (2-3 dagen development)

---

## 🚀 Future Enhancements

### Coming Soon...
*Meer features worden hier toegevoegd naar mate van feedback en gebruik.*

---

**Last Updated**: 2025-09-12  
**Version**: 1.0.0+