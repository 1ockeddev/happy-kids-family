-- Migration: Add updated_at field to app_user table
-- This allows tracking when user profile was last updated

-- Add updated_at column if not exists
ALTER TABLE app_user 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for faster sorting/filtering
CREATE INDEX IF NOT EXISTS idx_app_user_updated_at ON app_user(updated_at DESC);

-- Add comment
COMMENT ON COLUMN app_user.updated_at IS 'Last updated timestamp (for profile sync)';

-- Update existing rows to have updated_at = created_at
UPDATE app_user 
SET updated_at = created_at 
WHERE updated_at IS NULL;
