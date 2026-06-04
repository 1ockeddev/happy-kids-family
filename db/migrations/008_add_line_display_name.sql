-- Migration: Add line_display_name column to app_user table
-- Purpose: Separate LINE name (auto-updated) from custom display name (user editable)

-- Add line_display_name column
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS line_display_name TEXT;

-- Copy existing display_name to line_display_name for existing users with LINE ID
UPDATE app_user 
SET line_display_name = display_name 
WHERE line_user_id IS NOT NULL AND line_display_name IS NULL;

-- Add comment to explain the difference
COMMENT ON COLUMN app_user.display_name IS 'Custom display name (editable by admin)';
COMMENT ON COLUMN app_user.line_display_name IS 'Display name from LINE (auto-updated on login)';
