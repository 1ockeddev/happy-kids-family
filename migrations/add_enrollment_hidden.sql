-- Add hidden column to enrollment table
ALTER TABLE enrollment 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollment_hidden ON enrollment(hidden) WHERE hidden = FALSE;

COMMENT ON COLUMN enrollment.hidden IS 'Whether this enrollment should be hidden from daily report selection';
