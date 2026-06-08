-- Add teacher cohort settings to app_user table
-- This allows admin to configure which cohorts each teacher can access

ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS can_select_cohort BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_cohort_id UUID REFERENCES cohort(id) ON DELETE SET NULL;

COMMENT ON COLUMN app_user.can_select_cohort IS 'Whether teacher can select cohort in user side (true) or forced to use default_cohort_id (false)';
COMMENT ON COLUMN app_user.default_cohort_id IS 'Default cohort for teacher. If can_select_cohort=false, this is the only cohort they can access';
