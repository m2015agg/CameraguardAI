-- Update reviews table to include direct fields
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS camera text,
ADD COLUMN IF NOT EXISTS clip_url text,
ADD COLUMN IF NOT EXISTS snapshot_url text,
ADD COLUMN IF NOT EXISTS zones jsonb,
ADD COLUMN IF NOT EXISTS objects jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_camera ON reviews(camera);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Add RLS (Row Level Security) policies if not already present
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read reviews
CREATE POLICY "Allow authenticated users to read reviews"
    ON reviews
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow service role to insert reviews
CREATE POLICY "Allow service role to insert reviews"
    ON reviews
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create policy to allow service role to update reviews
CREATE POLICY "Allow service role to update reviews"
    ON reviews
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true); 