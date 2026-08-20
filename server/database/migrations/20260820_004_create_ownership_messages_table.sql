-- Migration 20260820_004: Create Ownership Messages Table

CREATE TABLE IF NOT EXISTS public.ownership_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.ownership_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin', 'superadmin')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.ownership_messages IS 'Stores chat messages between students and admins for an ownership claim';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_ownership_messages_updated_at ON public.ownership_messages;
CREATE TRIGGER trigger_ownership_messages_updated_at
    BEFORE UPDATE ON public.ownership_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
