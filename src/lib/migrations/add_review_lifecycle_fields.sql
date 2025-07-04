-- Add review lifecycle tracking fields to ai_alerts table
ALTER TABLE public.ai_alerts 
ADD COLUMN IF NOT EXISTS updated_at timestamptz,
ADD COLUMN IF NOT EXISTS latest_review_type text,
ADD COLUMN IF NOT EXISTS latest_review_timestamp timestamptz,
ADD COLUMN IF NOT EXISTS additional_objects jsonb,
ADD COLUMN IF NOT EXISTS additional_zones jsonb;

-- Add comments to explain the fields
COMMENT ON COLUMN ai_alerts.updated_at IS 'Timestamp when alert was last updated';
COMMENT ON COLUMN ai_alerts.latest_review_type IS 'Type of the latest review (new, update, end)';
COMMENT ON COLUMN ai_alerts.latest_review_timestamp IS 'Timestamp of the latest review update';
COMMENT ON COLUMN ai_alerts.additional_objects IS 'Additional objects detected in subsequent reviews';
COMMENT ON COLUMN ai_alerts.additional_zones IS 'Additional zones affected in subsequent reviews';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_alerts_updated_at ON ai_alerts(updated_at); 