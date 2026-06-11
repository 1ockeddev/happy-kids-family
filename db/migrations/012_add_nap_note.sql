-- Migration: Add nap_note field to daily_report table
-- Date: 2026-06-11
-- Description: Add optional note field for nap time (for cases when child doesn't nap)

-- Add nap_note column to daily_report table
ALTER TABLE daily_report 
ADD COLUMN IF NOT EXISTS nap_note TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN daily_report.nap_note IS 'Optional note for nap time, especially for cases when child does not nap (e.g., "ไม่นอน", "เล่นตลอด")';
