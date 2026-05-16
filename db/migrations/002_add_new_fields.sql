-- ============================================================
-- Migration 002: เพิ่ม fields ใหม่ (สำหรับ local DB เก่า)
-- ถ้ารัน 001 ใหม่แล้ว ไม่ต้องรัน 002 นี้
-- ============================================================

-- food_amount, fruit_amount
ALTER TABLE daily_report
  ADD COLUMN IF NOT EXISTS food_amount  milk_status DEFAULT 'skip',
  ADD COLUMN IF NOT EXISTS fruit_amount milk_status DEFAULT 'skip';

-- excretion enums
DO $$ BEGIN CREATE TYPE excretion_type AS ENUM ('pee','poo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE excretion_action AS ENUM ('diaper','potty');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- cast ถ้า column เป็น TEXT อยู่
DO $$ BEGIN
  ALTER TABLE child_excretion
    ALTER COLUMN type   TYPE excretion_type   USING type::excretion_type,
    ALTER COLUMN action TYPE excretion_action USING action::excretion_action;
EXCEPTION WHEN others THEN null; END $$;

-- cohort_ids ใน behavior_category
ALTER TABLE behavior_category
  ADD COLUMN IF NOT EXISTS cohort_ids UUID[] DEFAULT '{}';
