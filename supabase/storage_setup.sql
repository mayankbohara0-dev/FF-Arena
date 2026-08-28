-- =========================================================
-- FF ARENA - SUPABASE STORAGE BUCKET CONFIGURATION
-- Sets up the 'evidence' public bucket for match screenshots
-- =========================================================

-- 1. Create the 'evidence' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence',
    'evidence',
    true,
    10485760, -- 10 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760;

-- 2. Storage Security Policies for 'evidence'
-- Allow players to upload match screenshot evidence
CREATE POLICY "Allow public uploads to evidence bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidence');

-- Allow anyone to view verified match screenshot proofs
CREATE POLICY "Allow public read of evidence bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidence');

-- Allow updates (overwrite) on existing evidence
CREATE POLICY "Allow public updates to evidence bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'evidence');
