-- MIGRATION_V5_MEDIA.sql

-- 1. Add Media Columns to Tickets Table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- 2. Create Storage Bucket for Service Attachments (if not exists)
-- Note: Buckets are usually created via API/Dashboard, but we can try to insert if using pg_net or similar, 
-- but standards suggestion is to use the Dashboard. 
-- However, we can set up the POLICIES assuming the bucket 'service-attachments' exists.

-- 3. Storage Policies for 'service-attachments' bucket

-- Policy: Give users access to their own folders or public read? 
-- Let's make it Public Read for simplicity in this MVP, but Authenticated Upload.

-- Allow Public Read
CREATE POLICY "Public Access to Service Attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'service-attachments' );

-- Allow Authenticated Users to Upload
CREATE POLICY "Authenticated Users can Upload Service Attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow Users to Update their own files (optional)
CREATE POLICY "Users can update own service attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-attachments' 
  AND auth.uid() = owner
);
