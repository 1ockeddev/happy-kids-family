# Nap Note & MilkStatus Label Update Summary

**Date**: 2026-06-11  
**Status**: ✅ Completed & Tested

## Overview
This update includes two main changes:
1. Update MilkStatus labels to match spec requirements
2. Add nap_note field to daily reports for recording notes when children don't nap

---

## 1. MilkStatus Label Updates

### Changed Labels
Updated `not_must` label from "ไม่จำเป็น" to "นิดหน่อย" across all files to match spec.

**New Labels:**
- `all` → "ทานหมด"
- `some` → "บางส่วน"
- `not_must` → "นิดหน่อย" ✨ (changed from "ไม่จำเป็น")
- `skip` → "ข้าม"

### Files Updated
- ✅ `app/page.tsx`
- ✅ `app/summary-food-milk/page.tsx`
- ✅ `app/admin/daily/page.tsx`
- ✅ `app/admin/reports/page.tsx`
- ✅ `components/admin/ReportModalContent.tsx`

---

## 2. Nap Note Feature

### Database Changes
**Migration**: `db/migrations/012_add_nap_note.sql`
```sql
ALTER TABLE daily_report 
ADD COLUMN IF NOT EXISTS nap_note TEXT;
```

✅ Migration executed successfully

### API Changes

**POST /api/daily-reports** (Create)
- Added `nap_note` to request body extraction
- Added `nap_note` to INSERT statement
- Added `nap_note` to ON CONFLICT UPDATE

**PATCH /api/daily-reports/[id]** (Update)
- Added `nap_note` to request body extraction
- Added `nap_note` to UPDATE statement with COALESCE logic

### Type Definitions
**types/index.ts**
```typescript
export interface DailyReport {
  // ... other fields
  nap_from: string | null;
  nap_to: string | null;
  nap_note: string | null; // ✨ New field
  // ... other fields
}
```

### Frontend Changes

**1. Admin Reports (`app/admin/reports/page.tsx`)**
- ✅ Added `nap_note` to EMPTY_FORM
- ✅ Added nap note input field in modal
- ✅ Updated save handler to include nap_note
- ✅ Updated openEdit to load nap_note

**2. Admin Daily (`app/admin/daily/page.tsx`)**
- ✅ Added `nap_note` to EMPTY_REPORT_FORM
- ✅ Added nap note input field in modal
- ✅ Updated both save handlers (handleSave & handleSaveReport) to include nap_note
- ✅ Support for multiple children reports

**3. Report Modal Component (`components/admin/ReportModalContent.tsx`)**
- ✅ Added `nap_note` to interface props
- ✅ Added nap note input field in UI
- ✅ Connected to form state

**4. User Page (`app/page.tsx`)** ⭐ NEW
- ✅ Display nap_note when child doesn't nap (no nap_from/nap_to)
- ✅ Styled note box with yellow warning theme
- ✅ Shows "ไม่ได้นอนกลางวัน" with note below if available

### UI Implementation

**Admin Modal (Reports & Daily)**
```tsx
{/* Nap Note */}
<div className="form-group" style={{ marginTop: 10 }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
    <label className="form-label" style={{ margin: 0 }}>
      หมายเหตุ (สำหรับเด็กไม่นอน)
    </label>
  </div>
  <input 
    className="form-input" 
    placeholder="เช่น ไม่นอน, เล่นตลอด, นอนดึก..."
    value={form.nap_note}
    onChange={e => setForm(f => ({ ...f, nap_note: e.target.value }))} 
  />
</div>
```

**User Page Display**
```tsx
{/* When child doesn't nap (no nap_from/nap_to) */}
<div style={{color:'#94a3b8',fontSize:14}}>
  <p style={{marginBottom: report.nap_note ? 6 : 0}}>ไม่ได้นอนกลางวัน</p>
  {report.nap_note && (
    <div style={{
      background:'#fef3c7',
      border:'1px solid #fbbf24',
      borderRadius:8,
      padding:'8px 12px',
      marginTop:8
    }}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
        <svg>...</svg> {/* Info icon */}
        <span style={{fontSize:'0.7rem',fontWeight:700,color:'#b45309'}}>
          หมายเหตุ
        </span>
      </div>
      <p style={{fontSize:'0.85rem',color:'#92400e',margin:0}}>
        {report.nap_note}
      </p>
    </div>
  )}
</div>
```

### Mock Data
**lib/mock-data.ts**
- ✅ Added `nap_note: null` to all mock daily reports

---

## Testing Results

### Build Status
```bash
npm run build
```
✅ **Build successful** - No TypeScript errors  
✅ **51 routes compiled** successfully  
✅ All type checks passed

### Database Migration
```bash
node scripts/run-migration-012.js
```
✅ **Migration completed successfully**  
✅ nap_note column added to daily_report table

---

## Usage Examples

### Admin/Reports & Daily Pages
1. Click "เพิ่มรายงาน" or "แก้ไข" on existing report
2. Scroll to "การนอน" section
3. **Option A**: Enter nap times if child slept
4. **Option B**: Leave times empty and add note if child didn't sleep
5. Example notes: "ไม่นอน", "เล่นตลอด", "นอนดึก", "ง่วงแต่ไม่หลับ"
6. Click "บันทึก"

### User Side (Parent View)
**When child slept (has nap_from & nap_to):**
- Shows clock visualization
- Displays nap duration (X ชม. Y นาที)
- Shows timeline with start/end times

**When child didn't sleep (no nap times but has nap_note):**
- Shows "ไม่ได้นอนกลางวัน"
- Displays yellow info box with the note
- Example: 
  ```
  ไม่ได้นอนกลางวัน
  ┌──────────────────────┐
  │ ⓘ หมายเหตุ           │
  │ ไม่นอน เล่นตลอด     │
  └──────────────────────┘
  ```

---

## Files Changed Summary

### Database
- `db/migrations/012_add_nap_note.sql` (new)
- `scripts/run-migration-012.js` (new)

### Types
- `types/index.ts`
- `lib/mock-data.ts`

### API Routes
- `app/api/daily-reports/route.ts`
- `app/api/daily-reports/[id]/route.ts`

### Frontend Pages
- `app/page.tsx` (Calendar import fix + nap_note display)
- `app/summary-food-milk/page.tsx` (label update)
- `app/admin/daily/page.tsx` (label + nap_note)
- `app/admin/reports/page.tsx` (label + nap_note)

### Components
- `components/admin/ReportModalContent.tsx` (label + nap_note)

---

## Deployment Notes

### Pre-deployment Checklist
- ✅ Database migration script ready
- ✅ All TypeScript types updated
- ✅ Build passes without errors
- ✅ API endpoints handle nap_note correctly
- ✅ Frontend forms include nap_note field

### Deployment Steps
1. **Backup database** before running migration
2. Run migration: `node scripts/run-migration-012.js`
3. Deploy application code
4. Test create/edit functionality in both admin pages

### Rollback Plan
If issues occur:
```sql
-- Remove nap_note column
ALTER TABLE daily_report DROP COLUMN IF EXISTS nap_note;
```
Then redeploy previous version of application code.

---

## Additional Notes

- Field is **optional** - can be left empty
- Uses TEXT type for flexibility in note length
- Automatically includes in both create and update operations
- Compatible with existing reports (null values)
- **User-facing display**: Shows yellow info box when child doesn't nap
- **Admin interface**: Available for both reports and daily record management
- **Visual feedback**: Clear distinction between "slept" (timeline) and "didn't sleep" (note box)

---

**Completed by**: Kiro AI Assistant  
**Review Status**: Ready for production  
**Last Updated**: 2026-06-11 (Added user-side nap_note display)
