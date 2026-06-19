# Database Update Feature Guide

## Overview
Added UPDATE functionality to `/admin/database` page allowing admins to update individual records in any table.

## Implementation Summary

### 1. API Endpoint: `/api/db-update`

**File:** `app/api/db-update/route.ts`

#### POST - Update Record
Updates one or more records based on ID or WHERE clause.

**Request Body:**
```json
{
  "table": "child",
  "id": "abc-123",  // Optional: Update by ID
  "where": "status = 'active'",  // Optional: Custom WHERE clause
  "updates": {
    "name_en": "John Doe",
    "nickname_th": "จอห์น"
  }
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "abc-123",
      "name_en": "John Doe",
      "nickname_th": "จอห์น",
      "updated_at": "2024-03-15T10:30:00Z"
    }
  ]
}
```

#### GET - Fetch Record for Editing
Retrieves a single record by ID to populate the edit form.

**Query Parameters:**
- `table`: Table name (required)
- `id`: Record ID (required)

**Example:**
```
GET /api/db-update?table=child&id=abc-123
```

**Response:**
```json
{
  "data": {
    "id": "abc-123",
    "name_en": "John Doe",
    "nickname_th": "จอห์น",
    "birthdate": "2020-01-01",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Admin UI Features

**Location:** `/admin/database` page

#### UI Components:
1. **Table Selector** - Choose which table to update
2. **Record ID Input** - Enter the ID of the record to edit
3. **Load Button** - Fetches current record data
4. **Edit Form** - Shows all fields with current values
5. **Update Button** - Saves changes to the database
6. **Result Display** - Shows success/error message

#### Features:
- ✅ **Read-only fields**: `id`, `created_at`, `updated_at` cannot be edited
- ✅ **JSON field support**: Automatically detects and formats JSON fields
- ✅ **NULL handling**: Empty fields save as NULL
- ✅ **Auto-refresh**: After successful update, data is reloaded
- ✅ **Error handling**: Clear error messages for validation failures
- ✅ **Responsive UI**: Scrollable form for large records

#### Field Types:
- **Text fields**: Regular input for strings, numbers, dates
- **JSON fields**: Textarea with syntax highlighting (objects/arrays)
- **Read-only fields**: Grayed out, cannot be modified

### 3. Security Features

#### Table Whitelist
Only these tables can be updated via the API:
```typescript
const ALLOWED_TABLES = [
  'app_user', 'child', 'cohort', 'parent_child',
  'teacher_permission', 'enrollment', 'daily', 'attendance',
  'daily_report', 'behavior_category', 'behavior_item',
  'child_behavior_score', 'child_excretion', 'holidays',
  'user_analytics', 'line_flex_templates', 'line_groups',
  'line_group_members', 'line_group_events'
];
```

#### Validation:
- ✅ Table name must be in whitelist
- ✅ Either `id` or `where` clause is required
- ✅ Updates object must have at least one field
- ✅ Read-only fields are filtered out before update

#### Automatic Fields:
- Tables with `updated_at` field: Automatically set to `NOW()`
- Supported tables: `daily`, `attendance`, `daily_report`, `holidays`, `line_flex_templates`

### 4. Usage Examples

#### Example 1: Update Child Name
1. Select table: "นักเรียน (child)"
2. Enter ID: "abc-123-def-456"
3. Click "โหลดข้อมูล"
4. Edit fields:
   - `name_en`: "John Smith"
   - `nickname_th`: "จอห์น"
5. Click "อัปเดตข้อมูล"

#### Example 2: Update JSON Template
1. Select table: "line_flex_templates"
2. Enter ID: template UUID
3. Edit `template` field (JSON object)
4. Update saves parsed JSON

#### Example 3: Set Field to NULL
1. Load record
2. Clear field value (empty string)
3. Update → saves as NULL

### 5. Error Handling

#### Common Errors:
- **"Invalid or missing table name"** - Table not in whitelist
- **"No records found to update"** - ID doesn't exist or WHERE matches nothing
- **"Record not found"** (GET) - ID doesn't exist in table

#### Error Display:
- Red alert box with error icon
- Clear error message
- Preserves form state for correction

### 6. Technical Details

#### Database Query Pattern:
```sql
UPDATE "table_name"
SET "field1" = $1, "field2" = $2, updated_at = NOW()
WHERE id = $3
RETURNING *
```

#### Type Safety:
- Uses TypeScript with proper typing
- `query()` and `queryOne()` from `lib/db.ts`
- Proper error handling with try-catch

#### State Management:
- React hooks for form state
- Separate loading states for fetch vs update
- Result state for success/error feedback

## Files Modified

### New Files:
- `app/api/db-update/route.ts` - API endpoint for updates

### Modified Files:
- `app/admin/database/page.tsx` - Added UPDATE UI section

## Integration with Existing Features

The UPDATE feature complements existing database admin tools:
- **Export** - Backup before updates
- **SQL Query Builder** - Find records to update
- **Import** - Bulk updates via file
- **Update** - Individual record editing ⭐ NEW

## Future Enhancements (Optional)

Possible improvements:
1. Inline editing from query results
2. Batch update multiple records
3. Update history/audit log
4. Field validation based on type
5. Relationship management (foreign keys)
6. Custom WHERE clause UI builder

## Testing

Test the feature:
1. Navigate to `/admin/database`
2. Expand "Update Record" section
3. Select a table (e.g., `child`)
4. Enter a valid ID from your database
5. Click "โหลดข้อมูล"
6. Modify some fields
7. Click "อัปเดตข้อมูล"
8. Verify success message and updated data

## Notes

- ⚠️ **Use with caution** - Updates are permanent
- 💡 **Backup first** - Export before making changes
- 🔒 **Admin only** - Ensure proper authentication
- 📝 **Validation** - No client-side type validation (accept any value)
- 🔄 **Auto-refresh** - Form reloads after successful update

---

**Status:** ✅ Complete  
**Date:** 2024-03-15  
**Location:** `/admin/database`  
**API:** `POST /api/db-update`, `GET /api/db-update`
