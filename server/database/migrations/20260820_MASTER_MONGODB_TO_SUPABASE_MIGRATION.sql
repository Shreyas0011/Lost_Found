-- ====================================================================
-- MASTER MIGRATION: COMPLETE MONGODB TO SUPABASE POSTGRESQL SCHEMA
-- Project: Transcend Lost & Found Module
-- Target: Supabase PostgreSQL (https://wnncjeqfhbfkjexghehe.supabase.co)
-- ====================================================================

-- 1. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    class TEXT,
    section TEXT,
    parent_name TEXT,
    parent_email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT NOT NULL UNIQUE,
    uid TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN (
        'Electronics', 'Clothing', 'Books', 'ID / Cards',
        'Accessories', 'Bags', 'Keys', 'Stationery', 'Other'
    )),
    who_found TEXT DEFAULT '',
    location_found TEXT NOT NULL CHECK (location_found IN (
        'Library', 'Cafeteria', 'Classroom', 'Hostel',
        'Parking', 'Sports Area', 'Administrative Block', 'Other'
    )),
    date_found TIMESTAMPTZ NOT NULL,
    time_found TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    image_filename TEXT DEFAULT '',
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    submitted_by UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN (
        'PUBLISHED', 'UNCLAIMED', 'CLAIMED', 'RETURNED', 'EXPIRED', 'DEACTIVATED', 'DONATED'
    )),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    handover_form_url TEXT DEFAULT '',
    handover_form_filename TEXT DEFAULT '',
    handover_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    handover_date TIMESTAMPTZ,
    handover_notes TEXT DEFAULT '',
    handover_student_name TEXT DEFAULT '',
    handover_reg_number TEXT DEFAULT '',
    handover_phone TEXT DEFAULT '',
    handover_department TEXT DEFAULT '',
    claimed_by_admin TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Ownership Requests Table
CREATE TABLE IF NOT EXISTS public.ownership_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    in_person_preferred_date TIMESTAMPTZ,
    in_person_preferred_time TEXT DEFAULT '',
    in_person_note TEXT DEFAULT '',
    in_person_status TEXT NOT NULL DEFAULT 'NONE' CHECK (in_person_status IN (
        'NONE', 'REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Ownership Messages Table
CREATE TABLE IF NOT EXISTS public.ownership_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.ownership_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin', 'superadmin')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Performance Indexes
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

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_messages ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies: Full Access for Backend service_role
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

-- 9. Controlled Public Read Policy for Published Items
DROP POLICY IF EXISTS "Public Read Published Items" ON public.items;
CREATE POLICY "Public Read Published Items" ON public.items
    FOR SELECT USING (status = 'PUBLISHED');
