# Technical Documentation - Portfolio System

## Overview
This portfolio system uses Supabase as the backend with a multi-backend architecture that also supports Cloudbox. The system includes user authentication, content management, file storage, and a page builder.

## Database Schema

### User Management

#### `profiles`
User profile information and roles.
```sql
- id: uuid (primary key, gen_random_uuid())
- user_id: uuid (references auth.users, not null)
- email: text (not null)
- full_name: text (nullable)
- role: user_role enum (default: 'editor')
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

**User Roles Enum:**
```sql
CREATE TYPE user_role AS ENUM ('admin', 'editor');
```

### Content Management

#### `site_settings`
Global site configuration and styling.
```sql
- id: uuid (primary key, gen_random_uuid())
- site_title: text (default: 'Portfolio')
- site_tagline: text (default: '')
- logo_url: text (nullable)
- logo_height: integer (default: 32)
- logo_position: text (default: 'left')
- logo_margin_top: integer (default: 0)
- logo_margin_left: integer (default: 0)
- logo_shadow: boolean (default: false)
- show_site_title: boolean (default: true)
- primary_color: text (default: '#2D3748')
- secondary_color: text (default: '#F7FAFC')
- accent_color: text (default: '#F6D55C')
- header_transparent: boolean (default: true)
- header_blur: boolean (default: true)
- header_background_opacity: numeric (default: 0.8)
- custom_font_family: text (nullable)
- custom_font_url: text (nullable)
- title_font_family: text (nullable)
- title_font_url: text (nullable)
- content_font_family: text (nullable)
- content_font_url: text (nullable)
- footer_enabled: boolean (default: true)
- footer_text: text (default: '© 2025 Portfolio. Alle rechten voorbehouden.')
- footer_color: text (default: '#ffffff')
- footer_background_color: text (default: '#2D3748')
- footer_font_family: text (default: 'Roboto')
- footer_font_size: integer (default: 14)
- footer_text_align: text (default: 'center')
- footer_height: integer (default: 80)
- footer_opacity: numeric (default: 0.8)
- footer_hover_opacity: numeric (default: 0.95)
- footer_blur: boolean (default: true)
- footer_overlay: boolean (default: false)
- portfolio_enabled: boolean (default: true)
- portfolio_title: text (default: 'Mijn Portfolio')
- portfolio_description: text (default: 'Ontdek verschillende projecten...')
- home_show_buttons: boolean (default: true)
- home_show_title_overlay: boolean (default: true)
- slideshow_show_arrows: boolean (default: true)
- slideshow_show_dots: boolean (default: true)
- slideshow_interval: integer (default: 6000)
- slideshow_transition: text (default: 'fade')
- slideshow_info_card_enabled: boolean (default: true)
- slideshow_info_card_position: text (default: 'bottom-left')
- slideshow_info_card_opacity: numeric (default: 0.8)
- slideshow_info_card_radius: integer (default: 8)
- slideshow_info_card_text_size: integer (default: 14)
- contact_email: text (nullable)
- contact_phone: text (nullable)
- contact_address: text (nullable)
- social_instagram: text (nullable)
- social_facebook: text (nullable)
- social_linkedin: text (nullable)
- openai_api_key: text (nullable)
- default_language: text (default: 'nl')
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `about_settings`
About page configuration.
```sql
- id: uuid (primary key, gen_random_uuid())
- main_title: text (default: 'Over Mij')
- intro_text: text (default: 'Hallo! Ik ben een gepassioneerde...')
- description_text: text (default: 'Mijn werk wordt gedreven...')
- profile_photo_url: text (nullable)
- quote_text: text (default: 'Creativiteit is niet wat je ziet...')
- quote_author: text (default: 'Edgar Degas')
- stats: jsonb (default: [{"label": "Projecten", "number": "50+"}, ...])
- services: jsonb (default: [{"icon": "Palette", "title": "Creatief Ontwerp", ...}])
- skills: jsonb (default: ["Fotografie", "Grafisch Ontwerp", ...])
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `contact_settings`
Contact form configuration.
```sql
- id: uuid (primary key, gen_random_uuid())
- contact_email: text (default: 'contact@example.com')
- contact_phone: text (nullable)
- contact_address: text (nullable)
- form_enabled: boolean (default: true)
- notification_email: text (nullable)
- auto_reply_enabled: boolean (default: true)
- auto_reply_subject: text (default: 'Bedankt voor je bericht')
- auto_reply_message: text (default: 'Bedankt voor je bericht! We nemen...')
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `contact_messages`
Contact form submissions.
```sql
- id: uuid (primary key, gen_random_uuid())
- name: text (not null)
- email: text (not null)
- phone: text (nullable)
- subject: text (nullable)
- message: text (not null)
- is_read: boolean (default: false)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

### Media Management

#### `albums`
Photo album organization.
```sql
- id: uuid (primary key, gen_random_uuid())
- name: text (not null)
- slug: text (not null)
- description: text (nullable)
- cover_photo_id: uuid (nullable)
- is_visible: boolean (default: true)
- sort_order: integer (default: 0)
- show_title_in_slideshow: boolean (default: true)
- show_description_in_slideshow: boolean (default: true)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `photos`
Photo metadata and organization.
```sql
- id: uuid (primary key, gen_random_uuid())
- album_id: uuid (nullable, references albums)
- filename: text (not null)
- file_url: text (not null)
- alt_text: text (nullable)
- caption: text (nullable)
- is_visible: boolean (default: true)
- sort_order: integer (default: 0)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `slideshow`
Homepage slideshow content.
```sql
- id: uuid (primary key, gen_random_uuid())
- title: text (not null)
- description: text (nullable)
- image_url: text (not null)
- link_url: text (nullable)
- is_active: boolean (default: true)
- sort_order: integer (default: 0)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

### Page Builder System

#### `page_builder_pages`
Custom pages and templates.
```sql
- id: uuid (primary key, gen_random_uuid())
- name: text (not null)
- slug: text (not null)
- description: text (nullable)
- is_published: boolean (default: false)
- is_template: boolean (default: false)
- is_homepage: boolean (default: false)
- template_category: text (nullable)
- parent_page_id: uuid (nullable)
- menu_order: integer (default: 0)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `page_builder_elements`
Page builder element data.
```sql
- id: uuid (primary key, gen_random_uuid())
- page_id: uuid (not null)
- element_id: text (not null)
- element_type: text (not null)
- parent_element_id: text (nullable)
- content: text (nullable)
- position_x: numeric (default: 0)
- position_y: numeric (default: 0)
- size_width: numeric (default: 100)
- size_height: numeric (default: 100)
- styles: jsonb (default: '{}')
- responsive_styles: jsonb (default: '{}')
- sort_order: integer (default: 0)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `footer_elements`
Footer builder elements.
```sql
- id: uuid (primary key, gen_random_uuid())
- element_id: text (not null)
- element_type: text (not null)
- parent_element_id: text (nullable)
- content: text (nullable)
- position_x: numeric (default: 0)
- position_y: numeric (default: 0)
- size_width: numeric (default: 100)
- size_height: numeric (default: 60)
- styles: jsonb (default: '{}')
- responsive_styles: jsonb (default: '{}')
- sort_order: integer (default: 0)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `pages`
Static content pages.
```sql
- id: uuid (primary key, gen_random_uuid())
- title: text (not null)
- slug: text (not null)
- content: text (nullable)
- meta_description: text (nullable)
- is_published: boolean (default: false)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

### Internationalization

#### `languages`
Supported languages configuration.
```sql
- id: uuid (primary key, gen_random_uuid())
- code: text (not null)
- name: text (not null)
- is_enabled: boolean (default: true)
- is_default: boolean (default: false)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

#### `translations`
Multi-language content translations.
```sql
- id: uuid (primary key, gen_random_uuid())
- translation_key: text (not null)
- language_code: text (not null)
- translation_value: text (not null)
- table_name: text (nullable)
- record_id: uuid (nullable)
- field_name: text (nullable)
- created_at: timestamp with time zone (default: now())
- updated_at: timestamp with time zone (default: now())
```

## Database Functions

### Authentication Functions
```sql
-- Check if user is admin
is_admin(_user_id uuid DEFAULT auth.uid()) RETURNS boolean

-- Check if user is authenticated (admin or editor)
is_authenticated_user(_user_id uuid DEFAULT auth.uid()) RETURNS boolean

-- Promote user to admin role
promote_to_admin(user_email text) RETURNS void
```

### Utility Functions
```sql
-- Auto-update timestamps
update_updated_at_column() RETURNS trigger

-- Handle new user registration
handle_new_user() RETURNS trigger
```

## Row Level Security (RLS) Policies

### Public Access Policies
- `site_settings`: Anyone can view, admins can modify
- `about_settings`: Anyone can view, authenticated users can manage
- `contact_settings`: Anyone can view, authenticated users can manage
- `albums`: Anyone can view visible albums, authenticated users manage all
- `photos`: Anyone can view photos from visible albums
- `slideshow`: Anyone can view active items
- `languages`: Anyone can view enabled languages
- `translations`: Anyone can view
- `page_builder_pages`: Anyone can view published pages
- `page_builder_elements`: Anyone can view elements from published pages
- `footer_elements`: Anyone can view
- `pages`: Anyone can view published pages

### Authenticated User Policies
- Most management operations require `is_authenticated_user()`
- Contact message insertion is public, viewing requires authentication
- Language management requires admin role

### User Profile Policies
- Users can view their own profile
- Admins can view/manage all profiles

## Storage Buckets

### Public Buckets
- `logos`: Site logos and branding
- `gallery-images`: Photo gallery images
- `slideshow-images`: Homepage slideshow images
- `custom-fonts`: Custom font files
- `fotos`: General photo storage

### Storage Policies
All buckets have public read access with authenticated user upload/management permissions.

## API Endpoints

### Authentication
```
POST /auth/v1/signup
POST /auth/v1/token?grant_type=password
POST /auth/v1/logout
GET /auth/v1/user
```

### Database Operations
```
GET /rest/v1/{table_name}
POST /rest/v1/{table_name}
PATCH /rest/v1/{table_name}
DELETE /rest/v1/{table_name}
```

### Storage Operations
```
POST /storage/v1/object/{bucket_name}/{file_path}
GET /storage/v1/object/{bucket_name}/{file_path}
DELETE /storage/v1/object/{bucket_name}/{file_path}
GET /storage/v1/object/public/{bucket_name}/{file_path}
```

### Edge Functions
```
POST /functions/v1/send-contact-email
POST /functions/v1/translate-content
POST /functions/v1/translate-album-descriptions
POST /functions/v1/add-ui-translations
```

## Edge Functions

### `send-contact-email`
Handles contact form submissions:
- Saves message to `contact_messages`
- Sends notification email if configured
- Sends auto-reply if enabled
- Uses Resend API for email delivery

### Translation Functions
- `translate-content`: General content translation
- `translate-album-descriptions`: Album-specific translation
- `add-ui-translations`: UI element translation

## Backend Adapter Pattern

### Supabase Adapter
Implements `BackendAdapter` interface:
- Authentication methods
- Database query builder
- Storage operations
- Function invocations

### Cloudbox Adapter (Alternative)
Same interface, different implementation:
- API Key authentication
- REST API endpoints
- Different URL structure: `/p/{projectId}/api/{resource}`

## Configuration

### Environment Variables
```
VITE_SUPABASE_URL=https://lpowueiolmezwzueljwx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=lpowueiolmezwzueljwx
```

### Multi-Backend Support
The system automatically detects backend type and creates appropriate adapter:
- Priority: Cloudbox configuration → Supabase fallback
- Runtime detection via `getBackendConfig()`
- Singleton pattern for adapter instances

## Security Considerations

### RLS Policies
- Public content visible to all
- Management operations require authentication
- Admin functions require admin role
- User data isolation through user_id checks

### Authentication Flow
- Email/password authentication
- Role-based access control
- Automatic profile creation on signup
- Session management with automatic refresh

### File Storage
- Public read access for portfolio content
- Authenticated upload requirements
- Bucket-based organization
- Automatic cleanup policies (can be implemented)

## Data Relationships

### Primary Relationships
- `photos.album_id` → `albums.id`
- `page_builder_elements.page_id` → `page_builder_pages.id`
- `profiles.user_id` → `auth.users.id`
- `translations.record_id` → various tables (polymorphic)

### Cascading Rules
- User deletion cascades to profiles
- Album deletion should cascade to photos (implement if needed)
- Page deletion cascades to elements

## Performance Considerations

### Indexing
- Primary keys auto-indexed
- Foreign key columns should have indexes
- `slug` fields for SEO-friendly URLs
- `sort_order` for efficient ordering

### Caching Strategy
- Static assets via CDN
- Database queries can be cached
- Real-time subscriptions for live updates

## Migration Strategy

For Cloudbox integration, map:
1. Tables → Collections
2. RLS policies → API permissions
3. Storage buckets → File storage areas
4. Edge functions → Server scripts
5. Authentication → API key + user management