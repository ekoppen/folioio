# Uitgeschakelde Functionaliteiten

Dit document bevat een overzicht van functionaliteiten die tijdelijk zijn uitgeschakeld en later opnieuw kunnen worden geactiveerd.

## Editor/Page Builder Functionaliteit

**Status**: Uitgeschakeld vanaf commit [datum]
**Reden**: Page builder functionaliteit is nog niet gereed voor productie gebruik
**Locatie**: Admin Dashboard > Editor tab

### Wat is uitgeschakeld:
- **Admin Tab**: "Editor" tab in het admin dashboard (regel 117-122 in `/src/pages/Admin.tsx`)
- **Content**: PageManager component en gerelateerde functionaliteit (regel 165-169 in `/src/pages/Admin.tsx`)
- **Hash navigation**: 'editor' is verwijderd uit validTabs array (regel 36 in `/src/pages/Admin.tsx`)

### Gerelateerde bestanden:
- `/src/pages/Admin.tsx` - Hoofdbestand waar Editor tab is uitgeschakeld
- `/src/components/page-editor/PageManager.tsx` - Page manager component
- `/src/components/page-editor/PageEditor.tsx` - Page editor component

### Heractiveren:
Om de Editor functionaliteit weer in te schakelen:

1. **Uncomment de Editor tab**:
   ```tsx
   // In /src/pages/Admin.tsx, regel ~117-122
   <TabsTrigger value="editor" className="flex items-center gap-2">
     <Edit className="w-4 h-4" />
     Editor
   </TabsTrigger>
   ```

2. **Uncomment de Editor content**:
   ```tsx
   // In /src/pages/Admin.tsx, regel ~165-169
   <TabsContent value="editor">
     <PageManager />
   </TabsContent>
   ```

3. **Voeg 'editor' toe aan validTabs**:
   ```tsx
   // In /src/pages/Admin.tsx, regel ~36
   const validTabs = ['settings', 'albums', 'editor', 'about', 'contact', 'custom', 'seo', 'users', 'account', 'footer'];
   ```

4. **Update grid-cols in TabsList**:
   ```tsx
   // In /src/pages/Admin.tsx, regel ~108
   <TabsList className="grid w-full grid-cols-11 lg:w-fit lg:grid-cols-11">
   ```

### Huidige functionaliteit:
De uitgeschakelde Editor tab zou de volgende functionaliteiten moeten bieden wanneer het wordt geactiveerd:
- **Page Builder**: Visuele page builder voor het maken van custom pagina's
- **Content Management**: Beheer van statische content en pagina structuur
- **Layout Editor**: Drag & drop interface voor pagina layout

### Technische details:
- **Framework**: React components met TypeScript
- **Dependencies**: Alle benodigde dependencies zijn al geïnstalleerd
- **Database**: Database schema is voorbereid voor page builder functionaliteit
- **Components**: Alle benodigde components zijn aanwezig maar inactief

---

## Toekomstige uitbreidingen

### Mogelijke extra functionaliteiten om uit te schakelen:
- **Talen/Languages**: Momenteel al uitgeschakeld in commentaar
- **Advanced SEO**: Geavanceerde SEO functionaliteiten
- **E-commerce**: Product catalogus en verkoop functionaliteiten

### Aanbevelingen:
- Test de Editor functionaliteit grondig in development omgeving voordat je het heractiveren
- Controleer database migraties en schema compatibility
- Valideer dat alle afhankelijke components correct functioneren
- Update documentatie wanneer functionaliteiten worden geheractiveerd

---

**Laatste update**: [Automatisch gegenereerd]
**Volgende review**: Bij volgende major release of op verzoek