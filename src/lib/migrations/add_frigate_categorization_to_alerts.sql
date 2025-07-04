-- Add Frigate categorization field to ai_alerts table (Phase 1)
ALTER TABLE public.ai_alerts 
ADD COLUMN IF NOT EXISTS frigate_categorization text CHECK (frigate_categorization IN ('alert', 'detection'));

-- Add comment to explain the field
COMMENT ON COLUMN ai_alerts.frigate_categorization IS 'Frigate categorization: alert or detection';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_alerts_frigate_categorization ON ai_alerts(frigate_categorization); 