-- Migration 003: เพิ่ม photo_url ให้ child
-- รันถ้า local DB เดิมยังไม่มี column นี้
ALTER TABLE child ADD COLUMN IF NOT EXISTS photo_url TEXT;
