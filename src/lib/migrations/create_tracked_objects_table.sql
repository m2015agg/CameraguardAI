-- Create tracked_objects table
CREATE TABLE IF NOT EXISTS tracked_objects (
    id BIGSERIAL PRIMARY KEY,
    tracked_object_type TEXT,
    tracked_object_id TEXT,
    camera TEXT,
    before_data JSONB,
    after_data JSONB,
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracked_objects_tracked_object_id ON tracked_objects(tracked_object_id);
CREATE INDEX IF NOT EXISTS idx_tracked_objects_camera ON tracked_objects(camera);
CREATE INDEX IF NOT EXISTS idx_tracked_objects_received_at ON tracked_objects(received_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE tracked_objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read tracked objects
CREATE POLICY "Allow authenticated users to read tracked objects"
    ON tracked_objects
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow service role to insert tracked objects
CREATE POLICY "Allow service role to insert tracked objects"
    ON tracked_objects
    FOR INSERT
    TO service_role
    WITH CHECK (true); 