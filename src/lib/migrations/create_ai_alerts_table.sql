-- Drop existing table if it exists
DROP TABLE IF EXISTS public.ai_alerts;

-- Create ai_alerts table
CREATE TABLE public.ai_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL,
    camera text NOT NULL,
    label text,
    zones jsonb,
    created_at timestamptz DEFAULT now(),

    -- Alert decision
    reason text, -- explanation from AI
    confidence float, -- optional AI confidence score
    triggered boolean DEFAULT false, -- whether it was sent to HA

    -- User feedback
    user_feedback text, -- 'good', 'false_alert', 'unsure'
    feedback_comments text,
    feedback_given_at timestamptz
);

-- Create indexes for better query performance
CREATE INDEX idx_ai_alerts_event_id ON ai_alerts(event_id);
CREATE INDEX idx_ai_alerts_camera ON ai_alerts(camera);
CREATE INDEX idx_ai_alerts_created_at ON ai_alerts(created_at);
CREATE INDEX idx_ai_alerts_triggered ON ai_alerts(triggered);

-- Add RLS (Row Level Security) policies
ALTER TABLE ai_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read ai_alerts
CREATE POLICY "Allow authenticated users to read ai_alerts"
    ON ai_alerts
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow service role to insert ai_alerts
CREATE POLICY "Allow service role to insert ai_alerts"
    ON ai_alerts
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create policy to allow service role to update ai_alerts
CREATE POLICY "Allow service role to update ai_alerts"
    ON ai_alerts
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true); 