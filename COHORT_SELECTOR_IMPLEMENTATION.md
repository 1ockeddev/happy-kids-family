# Cohort Selector Implementation for Teacher Mode

## Summary
Implemented cohort/class selector for teacher mode that filters children by selected cohort.

## Changes Made

### 1. UserAppProvider (`components/UserAppProvider.tsx`)
**Added cohort management to context:**
- Added `cohorts` state: array of `{ id, name, level }`
- Added `cohortId` state: currently selected cohort
- Added `allChildren` state: unfiltered list of all children
- Modified `children` state: filtered by selected cohort in teacher mode
- Added `setCohortId` function to change selected cohort
- Exported all cohort-related values in context

**Logic:**
- On teacher login: fetch all cohorts from `/api/cohorts`
- Auto-select first cohort or restore from localStorage
- Fetch all children from `/api/children`
- Filter children based on current enrollments in selected cohort
- Persist `selectedCohortId` to localStorage
- Reset childId if current child not in selected cohort

### 2. AppHeader (`components/AppHeader.tsx`)
**Added cohort selector UI for teacher mode:**
- New props: `cohorts`, `cohortId`, `onCohortSelect`
- Added styled dropdown select for cohort selection
- Displays: "เลือกรุ่น / ห้องเรียน" label
- Shows cohort name + level (e.g., "ปฐมวัย (K1)")
- Appears above child selector in teacher mode
- Shows "ไม่มีนักเรียนในรุ่นนี้" when no children in selected cohort

**Teacher Mode UI Flow:**
```
1. Cohort Selector (dropdown)
   ↓
2. Child Selector (avatar row)
   ↓
3. Two-way selector (parent ❤️ child) - only when child selected
```

### 3. UserLayout (`components/UserLayout.tsx`)
**Updated to pass cohort props:**
- Extract `cohorts`, `cohortId`, `setCohortId` from context
- Pass to AppHeader component

### 4. Main Page (`app/page.tsx`)
**Updated to use cohort context:**
- Extract `cohorts`, `cohortId`, `setCohortId` from useUserApp hook
- Pass cohort props to AppHeader
- Added `childEnrollmentCohortId` local state to track child's enrollment cohort (for holiday filtering)
- Renamed local cohortId references to avoid collision with context cohortId

## User Flow

### Teacher Mode:
1. Login → loads all cohorts
2. Auto-selects first cohort (or restores last selected from localStorage)
3. Loads all children, filters by selected cohort
4. Can change cohort via dropdown → children list updates
5. Selection persists in localStorage

### Parent Mode:
- Unchanged behavior
- Shows all children for parent
- No cohort selector visible

## Data Persistence
- `selectedCohortId`: saved to localStorage when changed
- `selectedChildId`: saved to localStorage when changed
- `selectedParentId`: saved to localStorage when changed

## API Calls
- `/api/cohorts` - fetch all cohorts (teacher mode only)
- `/api/children` - fetch all children (teacher mode only)
- `/api/enrollments?cohort_id={id}` - filter children by cohort
- `/api/report/line-children?line_user_id={id}` - fetch children for parent

## Files Modified
1. `components/UserAppProvider.tsx` - Added cohort state and filtering logic
2. `components/AppHeader.tsx` - Added cohort selector UI
3. `components/UserLayout.tsx` - Pass cohort props
4. `app/page.tsx` - Extract and pass cohort data

## Testing Checklist
- [ ] Teacher mode shows cohort dropdown
- [ ] Changing cohort filters children correctly
- [ ] Selected cohort persists on page navigation
- [ ] Selected cohort persists on page refresh
- [ ] Empty cohort shows "ไม่มีนักเรียนในรุ่นนี้"
- [ ] Parent mode doesn't show cohort selector
- [ ] Child selection works after cohort change
- [ ] localStorage stores selectedCohortId correctly

## Notes
- Cohort selector only visible in teacher mode
- Children are filtered by current active enrollments
- If selected child is not in new cohort, auto-select first child in that cohort
- Display names use fallback priority: `nickname_th || nickname_en || name_th || name_en`
