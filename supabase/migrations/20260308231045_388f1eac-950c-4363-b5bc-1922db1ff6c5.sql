-- Add payment proof columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS payment_screenshot_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tx_hash text;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment screenshots
CREATE POLICY "Authenticated users can upload payment screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow public read access to payment screenshots
CREATE POLICY "Public can view payment screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payment-screenshots');