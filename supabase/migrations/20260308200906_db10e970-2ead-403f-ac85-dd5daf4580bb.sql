
-- Add qr_image_url column to withdrawal_requests
ALTER TABLE public.withdrawal_requests ADD COLUMN qr_image_url text;

-- Create storage bucket for QR images
INSERT INTO storage.buckets (id, name, public) VALUES ('withdrawal-qr', 'withdrawal-qr', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own QR images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'withdrawal-qr' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to QR images
CREATE POLICY "Public read access for QR images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'withdrawal-qr');

-- Allow users to delete own QR images
CREATE POLICY "Users can delete own QR images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'withdrawal-qr' AND (storage.foldername(name))[1] = auth.uid()::text);
