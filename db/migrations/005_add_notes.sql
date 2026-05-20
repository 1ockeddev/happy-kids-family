-- Migration 005: เพิ่ม note สำหรับนม/อาหาร/ผลไม้ และ note ใน behavior score
ALTER TABLE daily_report
  ADD COLUMN IF NOT EXISTS milk1_note    TEXT,
  ADD COLUMN IF NOT EXISTS milk2_note    TEXT,
  ADD COLUMN IF NOT EXISTS food_note     TEXT,
  ADD COLUMN IF NOT EXISTS fruit_note    TEXT;
