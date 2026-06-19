# Database Schema Update Summary

## Overview
อัปเดต `/admin/database` page และ `/api/db-update` endpoint เพื่อให้รองรับ tables และ fields ทั้งหมดในระบบ

## Changes Made

### 1. เพิ่ม Tables ใหม่

เพิ่ม 4 tables ที่เกี่ยวกับ LINE Integration:

#### line_flex_templates
- **Label:** LINE Flex Templates
- **Fields:** id, name, description, template, created_at, updated_at
- **Migration:** `003_add_line_flex_templates.sql`
- **Purpose:** เก็บ template สำหรับ LINE Flex Messages

#### line_groups
- **Label:** LINE Groups
- **Fields:** id, line_group_id, group_name, group_type, status, picture_url, joined_at, left_at, created_at, updated_at
- **Migration:** `004_add_line_groups.sql`
- **Purpose:** เก็บข้อมูลกลุ่ม LINE ที่ bot เข้าร่วม

#### line_group_members
- **Label:** LINE Group Members
- **Fields:** id, group_id, user_id, line_user_id, display_name, picture_url, role, joined_at, left_at, status, created_at, updated_at
- **Migration:** `004_add_line_groups.sql`
- **Purpose:** เก็บสมาชิกในแต่ละกลุ่ม LINE

#### line_group_events
- **Label:** LINE Group Events
- **Fields:** id, group_id, line_user_id, event_type, message_type, message_text, message_data, created_at
- **Migration:** `004_add_line_groups.sql`
- **Purpose:** เก็บ events และ messages ในกลุ่ม LINE

### 2. เพิ่ม Fields ใน Tables เดิม

#### app_user
เพิ่ม fields:
- `display_name_th` - ชื่อแสดงภาษาไทย (migration 006)
- `can_select_cohort` - ครูสามารถเลือกห้องเรียนได้หรือไม่ (migration 010)
- `default_cohort_id` - ห้องเรียนเริ่มต้นสำหรับครู (migration 010)

**Updated fields list:**
```typescript
['id','line_user_id','role','status','display_name','display_name_th',
 'line_display_name','picture_url','can_select_cohort','default_cohort_id','created_at']
```

#### daily_report
✅ Fields ถูกต้องแล้ว (ไม่มี cohort_id ตาม schema จริง)

**Confirmed fields:**
```typescript
['id','daily_id','child_id','nap_from','nap_to','nap_note',
 'milk1','milk1_note','milk2','milk2_note',
 'food_amount','food_note','fruit_amount','fruit_note',
 'note','created_by','updated_by','updated_at','created_at']
```

### 3. อัปเดต API Endpoint

#### `/api/db-update` (POST/GET)

**เพิ่ม tables ใน whitelist:**
- `line_flex_templates`
- `line_groups`
- `line_group_members`
- `line_group_events`

**เพิ่ม tables ที่มี `updated_at` auto-update:**
- `line_groups`
- `line_group_members`

## Complete Table List

ระบบมี **19 tables** ทั้งหมด:

### Core Tables (14)
1. ✅ `app_user` - ผู้ใช้งาน
2. ✅ `child` - นักเรียน
3. ✅ `cohort` - ห้องเรียน
4. ✅ `parent_child` - ผู้ปกครอง-นักเรียน
5. ✅ `teacher_permission` - สิทธิ์ครู
6. ✅ `enrollment` - การลงทะเบียน
7. ✅ `daily` - บันทึกรายวัน
8. ✅ `attendance` - การเข้าเรียน
9. ✅ `daily_report` - รายงานรายวัน
10. ✅ `behavior_category` - หมวดหมู่พฤติกรรม
11. ✅ `behavior_item` - รายการพฤติกรรม
12. ✅ `child_behavior_score` - คะแนนพฤติกรรม
13. ✅ `child_excretion` - การขับถ่าย
14. ✅ `holidays` - วันหยุด

### Analytics & LINE Tables (5)
15. ✅ `user_analytics` - Analytics (การใช้งาน)
16. ✅ `line_flex_templates` - LINE Flex Templates ⭐ NEW
17. ✅ `line_groups` - LINE Groups ⭐ NEW
18. ✅ `line_group_members` - LINE Group Members ⭐ NEW
19. ✅ `line_group_events` - LINE Group Events ⭐ NEW

## Field Count Summary

| Table | Fields Count | Has updated_at |
|-------|--------------|----------------|
| app_user | 11 | ❌ |
| child | 13 | ❌ |
| cohort | 7 | ❌ |
| parent_child | 2 | ❌ |
| teacher_permission | 4 | ❌ |
| enrollment | 7 | ❌ |
| daily | 11 | ✅ |
| attendance | 9 | ✅ |
| daily_report | 19 | ✅ |
| behavior_category | 7 | ❌ |
| behavior_item | 8 | ❌ |
| child_behavior_score | 6 | ❌ |
| child_excretion | 6 | ❌ |
| holidays | 8 | ✅ |
| user_analytics | 15 | ❌ |
| line_flex_templates | 6 | ✅ |
| line_groups | 10 | ✅ |
| line_group_members | 12 | ✅ |
| line_group_events | 8 | ❌ |

## Verification Checklist

### ✅ Database Admin Page
- [x] เพิ่ม 4 LINE tables ใน TABLE_LABELS
- [x] เพิ่ม fields ทั้งหมดใน TABLE_COLUMNS
- [x] อัปเดต app_user fields (เพิ่ม display_name_th, can_select_cohort, default_cohort_id)
- [x] แก้ไข daily_report fields (ลบ cohort_id ที่ไม่มีจริง)
- [x] Export ทำงานกับ tables ใหม่
- [x] SQL Query Builder รองรับ tables ใหม่
- [x] UPDATE Record รองรับ tables ใหม่

### ✅ API Endpoint
- [x] เพิ่ม LINE tables ใน ALLOWED_TABLES
- [x] เพิ่ม LINE tables ที่มี updated_at
- [x] GET endpoint รองรับทุก table
- [x] POST endpoint รองรับทุก table

### ✅ Testing
- [x] No TypeScript errors
- [x] All tables accessible in admin UI
- [x] All fields shown in SQL Query Builder
- [x] All tables can be exported
- [x] All tables can be updated

## Migration Files Used

Total: 12 migration files

1. `001_initial.sql` - Base schema (14 tables)
2. `002_add_new_fields.sql` - เพิ่ม fields ใน daily_report, behavior_category
3. `003_add_child_photo.sql` - เพิ่ม photo_url ให้ child
4. `004_add_user_picture.sql` - เพิ่ม picture_url ให้ app_user
5. `005_add_notes.sql` / `005_daily_report_notes.sql` - เพิ่ม note fields
6. `006_optional_line_id.sql` - เพิ่ม display_name_th
7. `007_add_holidays.sql` - สร้าง holidays table
8. `008_add_line_display_name.sql` - เพิ่ม line_display_name
9. `009_add_child_name_fields.sql` - เพิ่ม firstname, lastname, nickname, birthdate
10. `010_add_teacher_cohort_settings.sql` - เพิ่ม can_select_cohort, default_cohort_id
11. `011_create_user_analytics.sql` - สร้าง user_analytics table
12. `012_add_nap_note.sql` - เพิ่ม nap_note
13. `003_add_line_flex_templates.sql` ⭐ - สร้าง line_flex_templates
14. `004_add_line_groups.sql` ⭐ - สร้าง LINE groups tables

## Files Modified

### Updated Files
1. `app/admin/database/page.tsx`
   - เพิ่ม 4 LINE tables ใน TABLE_LABELS
   - อัปเดต TABLE_COLUMNS ให้ครบทุก field
   - แก้ไข app_user fields
   - แก้ไข daily_report fields

2. `app/api/db-update/route.ts`
   - เพิ่ม LINE tables ใน ALLOWED_TABLES
   - เพิ่ม LINE tables ใน hasUpdatedAt check

### Documentation
- `DATABASE_SCHEMA_UPDATE.md` ⭐ NEW - สรุปการเปลี่ยนแปลง schema

## Usage Examples

### Export LINE Data
```
1. เลือกรูปแบบ: JSON
2. เลือกตาราง:
   ✅ LINE Flex Templates
   ✅ LINE Groups
   ✅ LINE Group Members
   ✅ LINE Group Events
3. กด Export JSON
```

### Query LINE Groups
```sql
-- SQL Query Builder
Table: line_groups
Fields: line_group_id, group_name, status, joined_at
WHERE: status = 'active'
LIMIT: 100
```

### Update LINE Group
```
1. Select table: LINE Groups (line_groups)
2. Enter ID: [group UUID]
3. Load Data
4. Edit fields:
   - group_name: "Happy Kids K2"
   - status: "active"
5. Update
```

## Schema Validation

### Verified Against Database
- ✅ All tables exist in migrations
- ✅ All fields exist in migrations
- ✅ No phantom fields (like cohort_id in daily_report)
- ✅ All foreign keys properly defined
- ✅ All indexes documented

### Cross-Reference with API Routes
- ✅ `/api/line/templates` uses line_flex_templates
- ✅ `/api/line/groups` uses line_groups
- ✅ `/api/line/groups/[groupId]/members` uses line_group_members
- ✅ `/api/line/groups/[groupId]/events` uses line_group_events
- ✅ `/api/webhook/line` inserts to all LINE tables

## Notes

### Important Points
1. **cohort_id in daily_report**: ไม่มีใน schema จริง (ลบออกแล้ว)
2. **display_name_th**: เพิ่มใน app_user สำหรับชื่อภาษาไทย
3. **can_select_cohort**: ใหม่สำหรับควบคุมการเลือกห้องของครู
4. **LINE tables**: ทั้ง 4 tables มี indexes สำหรับ performance
5. **updated_at**: AUTO update ใน 7 tables (daily, attendance, daily_report, holidays, line_flex_templates, line_groups, line_group_members)

### Future Considerations
- อาจต้องเพิ่ม RLS (Row Level Security) สำหรับ LINE tables
- พิจารณา soft delete สำหรับ LINE groups/members
- อาจต้องการ audit log สำหรับ sensitive updates

---

**Date:** 2024-06-19  
**Status:** ✅ Complete  
**Tables:** 19/19 (100%)  
**Fields:** All verified against migrations  
**API Coverage:** Full CRUD support
