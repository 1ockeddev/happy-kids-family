# Migration Instructions

## Task 6: Add firstname, lastname, nickname, and birthdate fields to children

### ✅ Completed Tasks

1. **Updated Child interface** (`types/index.ts`)
   - Added fields: `firstname_en`, `lastname_en`, `firstname_th`, `lastname_th`, `nickname_en`, `nickname_th`, `birthdate`

2. **Updated API routes**
   - `POST /api/children`: Accepts new fields, validates at least one name field is filled
   - `PATCH /api/children/[id]`: Updates new fields
   - `GET /api/children`: Searches across all name fields (including new ones)

3. **Updated Admin UI** (`app/admin/children/page.tsx`)
   - Added form inputs for all new fields
   - Two-column layout for firstname/lastname pairs
   - Date picker for birthdate
   - Validation: At least one name field must be filled
   - Helper note in form

4. **Fixed circular reference error** (`lib/mock-data.ts`)
   - Changed mock data to use inline objects instead of references
   - All mock data now includes new fields (with null values)

5. **Build verification**
   - ✅ Build passes successfully
   - No TypeScript errors
   - No circular reference errors

6. **Improved calendar auto-scroll** (`app/page.tsx`)
   - Added `requestAnimationFrame` for better DOM rendering timing
   - Multiple delay timers (100ms + 500ms) for different scenarios
   - Better fallback for older browsers
   - Improved mobile support with proper scroll calculations

---

## 🚀 Next Steps: Run Migration on Supabase

### Step 1: Connect to Supabase

Go to your Supabase project dashboard:
- Navigate to: **SQL Editor**

### Step 2: Run Migration SQL

Copy and execute the SQL from `migrations/add_child_name_fields.sql`:

```sql
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
```

### Step 3: Verify Migration

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'child'
ORDER BY ordinal_position;
```

### Step 4: Test the Feature

1. Go to `/admin/children`
2. Click "เพิ่มนักเรียน" (Add Student)
3. Try filling:
   - Only nickname_th → Should work ✅
   - Only firstname_en + lastname_en → Should work ✅
   - Leave all fields empty → Should show alert ❌
4. Edit existing child and add new fields
5. Search for children using new name fields

---

## 📋 Summary of Changes

### Files Modified

1. `types/index.ts` - Child interface
2. `app/api/children/route.ts` - GET/POST endpoints
3. `app/api/children/[id]/route.ts` - PATCH endpoint
4. `app/admin/children/page.tsx` - Admin UI form
5. `lib/mock-data.ts` - Mock data structure
6. `app/page.tsx` - Calendar auto-scroll improvement

### Files Created

1. `migrations/add_child_name_fields.sql` - Database migration

---

## ✅ Testing Checklist

- [ ] Run migration on Supabase database
- [ ] Create new child with only nickname_th
- [ ] Create new child with firstname/lastname fields
- [ ] Edit existing child to add new fields
- [ ] Search for children using new name fields
- [ ] Test form validation (empty form should show alert)
- [ ] Test date picker for birthdate
- [ ] Test photo upload with new fields
- [ ] Test on mobile device for calendar auto-scroll

---

## 📱 Mobile Testing Notes

The calendar auto-scroll has been improved with:
- `requestAnimationFrame` for better timing
- Multiple delay strategies (100ms + 500ms)
- Better scroll position calculation
- Fallback for older mobile browsers

Test on actual mobile device to verify auto-scroll works correctly.
