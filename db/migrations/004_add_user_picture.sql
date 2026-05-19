-- Migration 004: เพิ่ม picture_url ให้ app_user
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS picture_url TEXT;
