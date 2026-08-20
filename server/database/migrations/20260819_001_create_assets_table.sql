-- Migration 20260819_001: Create Assets Table and Indexes

-- Enable pgcrypto extension for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NULL,
    bucket TEXT NOT NULL DEFAULT 'project-assets',
    object_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    extension TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INTEGER NULL,
    height INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('uploading', 'active', 'deleted', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Add Comments
COMMENT ON TABLE public.assets IS 'Stores metadata for file assets uploaded to Supabase Storage';
COMMENT ON COLUMN public.assets.object_key IS 'Unique path key inside Supabase Storage bucket';
COMMENT ON COLUMN public.assets.status IS 'Lifecycle status: uploading, active, deleted, failed';

-- Create Indexes for performance and quick query lookup
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON public.assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_object_key ON public.assets(object_key);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_mime_type ON public.assets(mime_type);

-- Create automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to assets table
DROP TRIGGER IF EXISTS trigger_assets_updated_at ON public.assets;
CREATE TRIGGER trigger_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
