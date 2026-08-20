-- Migration 20260819_002 (Corrected): Assets Table Column Fix, RLS Policies, and Storage Bucket Configuration

-- 1. Fix owner_id data type from UUID to TEXT
-- The application uses MongoDB ObjectIds (24-char hex strings) and string usernames for owner_id.
ALTER TABLE public.assets ALTER COLUMN owner_id TYPE TEXT USING owner_id::text;

-- 2. Enable Row Level Security on assets table
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies on public.assets table
-- The Node.js Express backend accesses Supabase using the service_role key, which bypasses RLS automatically.
-- These policies safeguard the table against direct anon/client queries.

DROP POLICY IF EXISTS "Service Role Full Access Assets" ON public.assets;
CREATE POLICY "Service Role Full Access Assets" ON public.assets
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Public/Anon access: Allow reading active lost & found item assets only (excluding private handover forms)
DROP POLICY IF EXISTS "Public Read Item Assets" ON public.assets;
CREATE POLICY "Public Read Item Assets" ON public.assets
    FOR SELECT
    USING (
        status = 'active'
        AND object_key NOT LIKE 'entities/handover/%'
        AND object_key NOT LIKE 'private/%'
    );

-- 4. Supabase Storage Bucket Initialization (project-assets)
-- Private bucket configuration to protect sensitive physical handover forms and student PII.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-assets',
    'project-assets',
    false, -- Private bucket: access controlled via RLS and backend signed URLs
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];

-- 5. Storage Objects RLS Policies

-- Full management for backend service_role key
DROP POLICY IF EXISTS "Service Role Storage Objects Access" ON storage.objects;
CREATE POLICY "Service Role Storage Objects Access" ON storage.objects
    FOR ALL
    USING (bucket_id = 'project-assets' AND auth.role() = 'service_role')
    WITH CHECK (bucket_id = 'project-assets' AND auth.role() = 'service_role');

-- Public SELECT policy for lost & found item images ONLY (entities/item/... or temporary/...)
-- Private handover form documents (entities/handover/...) MUST be accessed via backend signed URLs.
DROP POLICY IF EXISTS "Public Read Item Images Storage" ON storage.objects;
CREATE POLICY "Public Read Item Images Storage" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'project-assets'
        AND (name LIKE 'entities/item/%' OR name LIKE 'temporary/%' OR name LIKE 'public/%')
    );
