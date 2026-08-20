-- Migration 20260820_005: Create Indexes and Row Level Security Policies

-- 1. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_reg_number ON public.students(registration_number);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_location_found ON public.items(location_found);
CREATE INDEX IF NOT EXISTS idx_items_date_found ON public.items(date_found DESC);
CREATE INDEX IF NOT EXISTS idx_items_uploaded_at ON public.items(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_submitted_by ON public.items(submitted_by);
CREATE INDEX IF NOT EXISTS idx_items_asset_id ON public.items(asset_id);
CREATE INDEX IF NOT EXISTS idx_items_handover_asset_id ON public.items(handover_asset_id);

CREATE INDEX IF NOT EXISTS idx_ownership_requests_item_id ON public.ownership_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_ownership_requests_student_id ON public.ownership_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_ownership_requests_status ON public.ownership_requests(status);
CREATE INDEX IF NOT EXISTS idx_ownership_requests_created_at ON public.ownership_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ownership_messages_request_id ON public.ownership_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_ownership_messages_created_at ON public.ownership_messages(created_at ASC);

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Grant Full Access to Backend service_role Key
-- The Express Node.js server accesses Supabase using the service_role key, which bypasses RLS automatically.
-- These explicit policies safeguard direct PostgREST client queries while preserving full backend capabilities.

DROP POLICY IF EXISTS "Service Role Full Access Students" ON public.students;
CREATE POLICY "Service Role Full Access Students" ON public.students
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Items" ON public.items;
CREATE POLICY "Service Role Full Access Items" ON public.items
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Requests" ON public.ownership_requests;
CREATE POLICY "Service Role Full Access Requests" ON public.ownership_requests
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Messages" ON public.ownership_messages;
CREATE POLICY "Service Role Full Access Messages" ON public.ownership_messages
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4. Controlled Public Read Policy for Published Items
-- Allows direct anonymous SELECT queries for items in 'PUBLISHED' status (excluding sensitive PII fields like handover forms)
DROP POLICY IF EXISTS "Public Read Published Items" ON public.items;
CREATE POLICY "Public Read Published Items" ON public.items
    FOR SELECT
    USING (status = 'PUBLISHED');
