# Supabase Backend Foundation Documentation

This directory contains the production-ready backend foundation integrating **Supabase PostgreSQL** as the primary relational database and **Supabase Storage** for persistent object/blob storage.

---

## 1. Layered Architecture Overview

The backend strictly follows a layered architecture to ensure separation of concerns:

```text
Client
  ↓
Routes (server/routes/assetRoutes.js)
  ↓
Controllers (server/controllers/assetController.js)
  ↓
Services (server/services/assetService.js)
  ↓
Repositories / Storage (server/repositories/)
  ↓
Supabase PostgreSQL & Storage (server/infrastructure/supabase/)
```

### Layer Responsibilities
- **Routes**: Define REST endpoints, apply JWT authentication, validation middleware, and invoke controllers.
- **Controllers**: Parse request params/body/files, delegate to services, format JSON response, and map errors.
- **Services**: Enforce business rules, validate file content/signatures, orchestrate Storage and Database operations, and execute compensation/rollback logic on partial failures.
- **Repositories**: Encapsulate database queries (`SupabaseAssetRepository`) and blob storage operations (`SupabaseStorageRepository`) behind abstract interface contracts (`AssetRepositoryInterface`, `StorageRepositoryInterface`).
- **Infrastructure**: Supabase client initialization handling anonymous and service-role keys.

---

## 2. Environment Configuration

Add the following environment variables to `server/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_STORAGE_BUCKET=project-assets
```

> **Security Note:** `SUPABASE_SERVICE_ROLE_KEY` is only used on the server side (`supabaseAdmin`) and is **never** exposed to the client.

---

## 3. Database Schema & Migrations

Database SQL migrations are located in `server/database/migrations/`:

### Migration Files
1. `20260819_001_create_assets_table.sql`:
   - Creates the `public.assets` table.
   - Defines columns: `id` (UUID PK), `owner_id` (UUID originally, altered to `TEXT` in 002), `bucket`, `object_key` (UNIQUE), `original_filename`, `mime_type`, `extension`, `size_bytes`, `width`, `height`, `status` (`uploading`, `active`, `deleted`, `failed`), `created_at`, `updated_at`, `deleted_at`.
   - Creates indexes on `owner_id`, `object_key`, `status`, `created_at`, and `mime_type`.
   - Attaches auto-update timestamp trigger for `updated_at`.

2. `20260819_002_create_assets_rls_policies.sql` (Corrected):
   - Alters `owner_id` column type to `TEXT` for compatibility with MongoDB ObjectIds and string usernames.
   - Enables Row Level Security (RLS) on `public.assets` with service_role full management and public read policy for non-private assets.
   - Initializes `project-assets` bucket as a private bucket (`public = false`) to protect sensitive physical handover forms.
   - Configures storage RLS policies granting `service_role` full control and public SELECT access restricted strictly to item images (`entities/item/...`, `temporary/...`).

---

## 4. API Endpoints

All endpoints require JWT Bearer authentication header: `Authorization: Bearer <token>`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/assets` | Upload file asset directly to server & Supabase Storage |
| `POST` | `/api/assets/upload-url` | Generate pre-signed upload URL for direct client upload |
| `POST` | `/api/assets/:id/complete` | Finalize direct client upload |
| `GET` | `/api/assets` | List assets with pagination (`?page=1&limit=20`) and filtering |
| `GET` | `/api/assets/:id` | Get asset metadata and signed access URLs |
| `DELETE` | `/api/assets/:id` | Delete asset (soft delete or `?hard=true`) with storage compensation |

---

## 5. File & Image Validation

File uploads undergo strict multi-point validation before storage:
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `text/plain`
- **Extension Matching**: Validates file extension matches declared MIME type.
- **Size Limit**: Enforces maximum size limit (10MB default).
- **Magic Bytes Signature Check**: Inspects initial buffer bytes to prevent content/extension spoofing.

---

## 6. Running Tests

Run unit and integration tests using Jest:

```bash
cd server
npm test
```

Test files located in `server/tests/`:
- `assetRepository.test.js`
- `storageRepository.test.js`
- `assetService.test.js`
- `assetRoutes.test.js`
