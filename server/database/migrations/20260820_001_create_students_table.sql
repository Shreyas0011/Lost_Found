-- Migration 20260820_001: Create Students Table

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

-- Comments
COMMENT ON TABLE public.students IS 'Stores student profile records for Lost & Found authentication and claims';
COMMENT ON COLUMN public.students.registration_number IS 'Unique uppercase student registration/roll number';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_students_updated_at ON public.students;
CREATE TRIGGER trigger_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
