-- Migration: Add firstname, lastname, nickname, and birthdate to child table
-- Date: 2026-06-05

-- Add new columns to child table
ALTER TABLE child
ADD COLUMN IF NOT EXISTS firstname_en VARCHAR(100),
ADD COLUMN IF NOT EXISTS lastname_en VARCHAR(100),
ADD COLUMN IF NOT EXISTS firstname_th VARCHAR(100),
ADD COLUMN IF NOT EXISTS lastname_th VARCHAR(100),
ADD COLUMN IF NOT EXISTS nickname_en VARCHAR(50),
ADD COLUMN IF NOT EXISTS nickname_th VARCHAR(50),
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Add comment to explain the new columns
COMMENT ON COLUMN child.firstname_en IS 'First name in English';
COMMENT ON COLUMN child.lastname_en IS 'Last name in English';
COMMENT ON COLUMN child.firstname_th IS 'ชื่อ (ภาษาไทย)';
COMMENT ON COLUMN child.lastname_th IS 'นามสกุล (ภาษาไทย)';
COMMENT ON COLUMN child.nickname_en IS 'Nickname in English';
COMMENT ON COLUMN child.nickname_th IS 'ชื่อเล่น (ภาษาไทย)';
COMMENT ON COLUMN child.birthdate IS 'วันเกิด';

-- Update search to include new fields (modify existing search query if needed)
-- Note: You may need to update the GET /api/children query to search these new fields
