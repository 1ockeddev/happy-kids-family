# Teacher Cohort Settings Feature

## Summary
Admin can now configure whether each teacher can select cohorts in User Side, and set default cohort.

## Features

### 1. Database Schema
**New columns in `users` table:**
- `can_select_cohort` (BOOLEAN, default: true)
  - `true`: Teacher can select cohort via dropdown in User Side
  - `false`: Teacher is forced to use `default_cohort_id`
- `default_cohort_id` (UUID, nullable)
  - Default cohort for teacher
  - If `can_select_cohort = false`, this is the ONLY cohort they can access

### 2. Admin Side Configuration

**Location:** `/admin/users` → Edit Teacher

**UI Features:**
- Checkbox: "อนุญาตให้เลือกห้องเรียนใน User Side"
- Dropdown: "ห้องเรียน Default"
- Visual feedback showing current state

**Validation:**
- If checkbox unchecked (`can_select_cohort = false`), default_cohort_id is required
- Shows warning if no default cohort selected

**Settings Explained:**

#### Option 1: Allow Selection (can_select_cohort = true)
```
✅ อนุญาตให้เลือกห้องเรียน
📍 ห้องเรียน Default: [ปฐมวัย (K1)]
```
- Teacher sees cohort dropdown in User Side
- Can switch between all cohorts
- Opens to default cohort on first load
- Selection persists in localStorage

#### Option 2: Fixed Cohort (can_select_cohort = false)
```
🔒 ไม่อนุญาตให้เลือกห้องเรียน
📍 ห้องเรียน Default: [ประถม (P1)] *required
```
- Teacher CANNOT see cohort dropdown
- Fixed to default cohort only
- Cannot switch cohorts
- Sees cohort name as read-only display

### 3. User Side Behavior

**Teacher Mode with Selection Allowed:**
```
┌────────────────────────────┐
│ เลือกรุ่น / ห้องเรียน     │
│ [Dropdown: ปฐมวัย (K1) ▼] │
├────────────────────────────┤
│ เลือกนักเรียน              │
│ [Avatar Row]                │
└────────────────────────────┘
```

**Teacher Mode with Fixed Cohort:**
```
┌────────────────────────────┐
│ ห้องเรียน                  │
│ 🏫 ปฐมวัย                  │
│    K1                       │
├────────────────────────────┤
│ เลือกนักเรียน              │
│ [Avatar Row]                │
└────────────────────────────┘
```

### 4. Selection Logic

**Priority (when `can_select_cohort = true`):**
1. Saved in localStorage
2. `default_cohort_id` from user settings
3. First cohort in list

**Fixed (when `can_select_cohort = false`):**
- Always uses `default_cohort_id`
- Ignores localStorage
- No selection UI shown

## Implementation Details

### Files Modified

1. **`db/migrations/010_add_teacher_cohort_settings.sql`**
   - Added new columns to users table

2. **`types/index.ts`**
   - Added `can_select_cohort?: boolean`
   - Added `default_cohort_id?: string | null`

3. **`app/admin/users/page.tsx`**
   - Added cohort loading
   - Added cohort settings UI in edit modal
   - Updated save handler to include cohort settings
   - Validation for fixed cohort mode

4. **`components/UserAppProvider.tsx`**
   - Check `can_select_cohort` setting
   - Use `default_cohort_id` when forced
   - Respect admin settings for cohort selection

5. **`components/AppHeader.tsx`**
   - Show dropdown only if `can_select_cohort = true`
   - Show read-only display if `can_select_cohort = false`
   - Visual distinction between modes

## Use Cases

### Use Case 1: Multi-Grade Teacher
**Settings:**
- ✅ `can_select_cohort = true`
- Default: "ปฐมวัย (K1)"

**Behavior:**
- Teacher can switch between K1, K2, K3
- Starts with K1 by default
- Can view all grades' students

### Use Case 2: Single-Grade Teacher
**Settings:**
- 🔒 `can_select_cohort = false`
- Default: "ประถม 1 (P1)" (required)

**Behavior:**
- Teacher can ONLY see P1 students
- No dropdown shown
- Cannot switch to other grades
- Simplified UI for dedicated teachers

### Use Case 3: Substitute Teacher
**Settings:**
- ✅ `can_select_cohort = true`
- Default: "ปฐมวัย (K1)"

**Behavior:**
- Can cover multiple grades as needed
- Flexible switching
- Good for temporary assignments

## Admin Workflow

### Configuring a New Teacher

1. **Create User**
   - Name: "ครูเบียร์"
   - Role: Teacher
   - Status: Active

2. **Set Cohort Access**
   - ✅ Allow selection? → Check/Uncheck
   - Select default cohort from dropdown

3. **Save**
   - Teacher will see settings immediately on next login

### Changing Teacher Assignment

1. **Edit Teacher**
   - Change `default_cohort_id`
   - Or toggle `can_select_cohort`

2. **Teacher Refreshes App**
   - Settings take effect
   - Cohort selection updates

## Migration Instructions

### Running the Migration

```bash
# Connect to database
psql your_database_url

# Run migration
\i db/migrations/010_add_teacher_cohort_settings.sql
```

### Default Values
- Existing teachers: `can_select_cohort = true` (no behavior change)
- `default_cohort_id = null` (will auto-select first cohort)

## Testing Checklist

### Admin Side
- [ ] Edit teacher shows cohort settings section
- [ ] Checkbox toggles dropdown requirement
- [ ] Validation shows when unchecked without default
- [ ] Settings save correctly
- [ ] Settings load correctly on edit

### User Side - Selection Allowed
- [ ] Cohort dropdown appears for teacher
- [ ] Can switch between cohorts
- [ ] Selection persists on navigation
- [ ] Default cohort loads on first visit
- [ ] Children filter by selected cohort

### User Side - Fixed Cohort
- [ ] No cohort dropdown shown
- [ ] Read-only cohort display shown
- [ ] Cannot switch cohorts
- [ ] Only default cohort's children shown
- [ ] LocalStorage ignored

### Parent Mode
- [ ] No cohort selector (unchanged)
- [ ] Shows all children (unchanged)

## Benefits

✅ **Flexibility**: Multi-grade teachers can switch cohorts
✅ **Security**: Limit teachers to specific grades
✅ **Simplicity**: Single-grade teachers see simpler UI
✅ **Control**: Admin has full control over access
✅ **UX**: Cleaner interface for dedicated teachers
✅ **Default**: Smart default cohort selection
