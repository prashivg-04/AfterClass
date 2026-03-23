-- Create the storage bucket (simplified for older Supabase)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('resources', 'resources', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to resources
CREATE POLICY "Public read access to resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

-- Allow users to delete their own files
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'resources' AND auth.role() = 'authenticated');