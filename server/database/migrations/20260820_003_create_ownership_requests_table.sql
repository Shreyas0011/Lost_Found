-- Migration 20260820_003: Create Ownership Requests Table

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

-- Comments
COMMENT ON TABLE public.ownership_requests IS 'Stores student claim ownership verification requests for items';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_ownership_requests_updated_at ON public.ownership_requests;
CREATE TRIGGER trigger_ownership_requests_updated_at
    BEFORE UPDATE ON public.ownership_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
