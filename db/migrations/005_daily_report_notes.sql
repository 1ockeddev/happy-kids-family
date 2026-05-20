-- Migration 005: เพิ่ม note columns ให้ daily_report
-- รันถ้า local DB เดิมยังไม่มี columns เหล่านี้
ALTER TABLE daily_report
  ADD COLUMN IF NOT EXISTS milk1_note  TEXT,
  ADD COLUMN IF NOT EXISTS milk2_note  TEXT,
  ADD COLUMN IF NOT EXISTS food_note   TEXT,
  ADD COLUMN IF NOT EXISTS fruit_note  TEXT;
