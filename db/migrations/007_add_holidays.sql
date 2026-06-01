-- Migration: Add holidays table for managing school holidays
-- This allows schools to mark specific dates as holidays (weekends, public holidays, school breaks)

CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  type VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'school', 'weekend'
  cohort_id UUID REFERENCES cohort(id) ON DELETE CASCADE, -- NULL = applies to all cohorts
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure no duplicate holidays for same date and cohort
  UNIQUE(date, cohort_id)
);

-- Index for faster lookups by date range
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_cohort_id ON holidays(cohort_id);
CREATE INDEX idx_holidays_type ON holidays(type);

-- Insert common Thai public holidays for 2025 (example data)
INSERT INTO holidays (date, name_th, name_en, type, cohort_id) VALUES
  ('2025-01-01', 'วันขึ้นปีใหม่', 'New Year''s Day', 'public', NULL),
  ('2025-02-12', 'วันมาฆบูชา', 'Makha Bucha Day', 'public', NULL),
  ('2025-04-06', 'วันจักรี', 'Chakri Memorial Day', 'public', NULL),
  ('2025-04-13', 'วันสงกรานต์', 'Songkran Festival', 'public', NULL),
  ('2025-04-14', 'วันสงกรานต์', 'Songkran Festival', 'public', NULL),
  ('2025-04-15', 'วันสงกรานต์', 'Songkran Festival', 'public', NULL),
  ('2025-05-01', 'วันแรงงานแห่งชาติ', 'Labour Day', 'public', NULL),
  ('2025-05-05', 'วันฉัตรมงคล', 'Coronation Day', 'public', NULL),
  ('2025-05-11', 'วันวิสาขบูชา', 'Visakha Bucha Day', 'public', NULL),
  ('2025-06-03', 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา', 'Queen Suthida''s Birthday', 'public', NULL),
  ('2025-07-28', 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', 'King''s Birthday', 'public', NULL),
  ('2025-07-29', 'วันอาสาฬหบูชา', 'Asalha Bucha Day', 'public', NULL),
  ('2025-08-12', 'วันแม่แห่งชาติ', 'Mother''s Day', 'public', NULL),
  ('2025-10-13', 'วันคืนสู่เมืองหลวง', 'King Bhumibol Memorial Day', 'public', NULL),
  ('2025-10-23', 'วันปิยมหาราช', 'King Chulalongkorn Memorial Day', 'public', NULL),
  ('2025-12-05', 'วันพ่อแห่งชาติ', 'Father''s Day', 'public', NULL),
  ('2025-12-10', 'วันรัฐธรรมนูญ', 'Constitution Day', 'public', NULL),
  ('2025-12-31', 'วันสิ้นปี', 'New Year''s Eve', 'public', NULL)
ON CONFLICT (date, cohort_id) DO NOTHING;

-- Insert common Thai public holidays for 2026
INSERT INTO holidays (date, name_th, name_en, type, cohort_id) VALUES
  ('2026-01-01', 'วันขึ้นปีใหม่', 'New Year''s Day', 'public', NULL),
  ('2026-01-02', 'วันหยุดพิเศษ', 'Additional Special Holiday', 'public', NULL),
  ('2026-03-03', 'วันมาฆบูชา', 'Makha Bucha Day', 'public', NULL),
  ('2026-04-06', 'วันจักรี', 'Chakri Memorial Day', 'public', NULL),
  ('2026-04-13', 'วันสงกรานต์', 'Songkran Festival', 'public', NULL),
  ('2026-04-14', 'วันสงกรานต์', 'Songkran Festival', 'public', NULL),
  ('2026-04-15', 'วันสงกรานต์', 'Songkran Festival', 'public', NULL),
  ('2026-05-01', 'วันแรงงานแห่งชาติ', 'Labour Day', 'public', NULL),
  ('2026-05-04', 'วันฉัตรมงคล', 'Coronation Day', 'public', NULL),
  ('2026-06-01', 'วันหยุดชดเชยวันวิสาขบูชา', 'Substitution for Visakha Bucha Day', 'public', NULL),
  ('2026-06-03', 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา', 'Queen Suthida''s Birthday', 'public', NULL),
  ('2026-07-28', 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', 'King''s Birthday', 'public', NULL),
  ('2026-07-29', 'วันอาสาฬหบูชา', 'Asalha Bucha Day', 'public', NULL),
  ('2026-08-12', 'วันแม่แห่งชาติ', 'Mother''s Day', 'public', NULL),
  ('2026-10-13', 'วันคล้ายวันสวรรคต รัชกาลที่ 9', 'King Bhumibol Memorial Day', 'public', NULL),
  ('2026-10-23', 'วันปิยมหาราช', 'King Chulalongkorn Memorial Day', 'public', NULL),
  ('2026-12-07', 'วันหยุดชดเชยวันพ่อแห่งชาติ', 'Substitution for Father''s Day', 'public', NULL),
  ('2026-12-10', 'วันรัฐธรรมนูญ', 'Constitution Day', 'public', NULL),
  ('2026-12-31', 'วันสิ้นปี', 'New Year''s Eve', 'public', NULL)
ON CONFLICT (date, cohort_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE holidays IS 'Stores school holidays, public holidays, and weekend closures';
COMMENT ON COLUMN holidays.type IS 'Type of holiday: public (national), school (school-specific), weekend (regular weekend closure)';
COMMENT ON COLUMN holidays.cohort_id IS 'NULL means applies to all cohorts, otherwise specific to one cohort';
