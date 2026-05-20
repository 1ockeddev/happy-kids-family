-- ============================================================
-- KinderCare — Initial Schema
-- รัน: Supabase SQL Editor → paste ทั้งหมด → Run
-- ============================================================

-- 1) ENUMs
DO $$ BEGIN CREATE TYPE attendance_status AS ENUM ('present','absent','sick','leave');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE milk_status AS ENUM ('all','some','not_must','skip');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('teacher','parent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE excretion_type AS ENUM ('pee','poo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE excretion_action AS ENUM ('diaper','potty');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) app_user
CREATE TABLE IF NOT EXISTS app_user (
  id            UUID PRIMARY KEY,
  line_user_id  TEXT UNIQUE NOT NULL,
  role          user_role NOT NULL,
  status        user_status DEFAULT 'active',
  display_name  TEXT,
  picture_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3) child
CREATE TABLE IF NOT EXISTS child (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     TEXT,
  name_th     TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4) cohort
CREATE TABLE IF NOT EXISTS cohort (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  level         TEXT,
  academic_year INTEGER,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5) parent_child
CREATE TABLE IF NOT EXISTS parent_child (
  parent_id UUID REFERENCES app_user(id),
  child_id  UUID REFERENCES child(id),
  PRIMARY KEY (parent_id, child_id)
);

-- 6) teacher_permission
CREATE TABLE IF NOT EXISTS teacher_permission (
  user_id              UUID PRIMARY KEY REFERENCES app_user(id),
  can_manage_daily     BOOLEAN DEFAULT FALSE,
  can_manage_attendance BOOLEAN DEFAULT FALSE,
  can_manage_report    BOOLEAN DEFAULT FALSE
);

-- 7) enrollment
CREATE TABLE IF NOT EXISTS enrollment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  cohort_id   UUID NOT NULL REFERENCES cohort(id),
  start_date  DATE NOT NULL,
  end_date    DATE,
  graduated   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, cohort_id, start_date)
);

-- 8) daily
CREATE TABLE IF NOT EXISTS daily (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id  UUID NOT NULL REFERENCES cohort(id),
  date       DATE NOT NULL,
  activity   TEXT,
  food       TEXT,
  fruit      TEXT,
  note       TEXT,
  created_by UUID REFERENCES app_user(id),
  updated_by UUID REFERENCES app_user(id),
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cohort_id, date)
);

-- 9) attendance
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_id   UUID NOT NULL REFERENCES daily(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  status     attendance_status DEFAULT 'present',
  note       TEXT,
  created_by UUID REFERENCES app_user(id),
  updated_by UUID REFERENCES app_user(id),
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (daily_id, child_id)
);

-- 10) daily_report
CREATE TABLE IF NOT EXISTS daily_report (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_id     UUID NOT NULL REFERENCES daily(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  nap_from     TIME,
  nap_to       TIME,
  milk1        milk_status DEFAULT 'skip',
  milk1_note   TEXT,
  milk2        milk_status DEFAULT 'skip',
  milk2_note   TEXT,
  food_amount  milk_status DEFAULT 'skip',
  food_note    TEXT,
  fruit_amount milk_status DEFAULT 'skip',
  fruit_note   TEXT,
  note         TEXT,
  created_by   UUID REFERENCES app_user(id),
  updated_by   UUID REFERENCES app_user(id),
  updated_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (daily_id, child_id)
);

-- 11) behavior_category
CREATE TABLE IF NOT EXISTS behavior_category (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     TEXT NOT NULL,
  name_th     TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  cohort_ids  UUID[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 12) behavior_item
CREATE TABLE IF NOT EXISTS behavior_item (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES behavior_category(id) ON DELETE CASCADE,
  name_en     TEXT NOT NULL,
  name_th     TEXT NOT NULL,
  max_score   INTEGER DEFAULT 3,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 13) child_behavior_score
CREATE TABLE IF NOT EXISTS child_behavior_score (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_id UUID NOT NULL REFERENCES daily(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  item_id  UUID NOT NULL REFERENCES behavior_item(id) ON DELETE CASCADE,
  score    INTEGER,
  note     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (daily_id, child_id, item_id)
);

-- 14) child_excretion
CREATE TABLE IF NOT EXISTS child_excretion (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_id   UUID NOT NULL REFERENCES daily(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  time       TIME,
  type       excretion_type,
  action     excretion_action,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- photo_url column (เพิ่มหลังสร้าง table แล้ว — idempotent)
ALTER TABLE child ADD COLUMN IF NOT EXISTS photo_url TEXT;
