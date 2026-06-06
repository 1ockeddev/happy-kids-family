-- Add line_display_name column to app_user table
-- This stores the display name from LINE (auto-updated from LINE profile)
-- while display_name is the custom name that can be edited by admin

ALTER TABLE app_user 
ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(255);

-- Add comment
COMMENT ON COLUMN app_user.line_display_name IS 'Display name from LINE profile (auto-updated)';

-- For existing users, copy display_name to line_display_name if they have a LINE ID
UPDATE app_user 
SET line_display_name = display_name 
WHERE line_user_id IS NOT NULL 
  AND line_display_name IS NULL;
