ALTER TABLE public.mission_applications 
ADD COLUMN delivery_url text,
ADD COLUMN delivered_at timestamp with time zone,
ADD COLUMN reviewed_at timestamp with time zone,
ADD COLUMN review_note text;