-- Migration 20260820_002: Create Items Table

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

-- Comments
COMMENT ON TABLE public.items IS 'Stores lost and found item records';
COMMENT ON COLUMN public.items.serial_number IS 'Human readable tracking code (e.g. LF-12345)';
COMMENT ON COLUMN public.items.asset_id IS 'Foreign key to public.assets metadata for the main item image';
COMMENT ON COLUMN public.items.handover_asset_id IS 'Foreign key to public.assets metadata for the physical claim handover form';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_items_updated_at ON public.items;
CREATE TRIGGER trigger_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
