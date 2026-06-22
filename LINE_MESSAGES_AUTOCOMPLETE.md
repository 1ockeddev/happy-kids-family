# LINE Messages: Autocomplete Feature

## Overview
เพิ่มฟีเจอร์ **autocomplete** สำหรับ User ID และ Group ID ในหน้า `/admin/line-messages` เพื่อให้ง่ายต่อการเลือกผู้รับข้อความ

## ✅ Features Added

### 1. Autocomplete Dropdown
- 🔍 แสดงรายชื่อ Users และ Groups ทั้งหมด
- 🔎 ค้นหาแบบ real-time (search by name or ID)
- 👤 แสดงไอคอน User (👤) และ Group (👥)
- 🏷️ แสดง badge ว่าเป็น USER หรือ GROUP
- 📋 แสดงชื่อและ ID ในแต่ละรายการ

### 2. API Endpoint
**File:** `app/api/line/recipients/route.ts`

**Endpoint:** `GET /api/line/recipients`

**Response:**
```json
{
  "recipients": [
    {
      "id": "U1234567890abcdef...",
      "label": "สมชาย ใจดี (parent)",
      "type": "user",
      "role": "parent"
    },
    {
      "id": "C1234567890abcdef...",
      "label": "Happy Kids K2 (group)",
      "type": "group",
      "groupType": "group"
    }
  ]
}
```

## How It Works

### Data Sources

#### 1. LINE Users
ดึงจาก `app_user` table:
```sql
SELECT 
  line_user_id as id,
  display_name,
  line_display_name,
  role,
  'user' as type
FROM app_user
WHERE line_user_id IS NOT NULL 
  AND status = 'active'
ORDER BY display_name ASC
```

**Display Format:**
- `[Name] (role)` 
- Example: "สมชาย ใจดี (parent)"

#### 2. LINE Groups
ดึงจาก `line_groups` table:
```sql
SELECT 
  line_group_id as id,
  group_name as display_name,
  group_type,
  'group' as type
FROM line_groups
WHERE status = 'active'
ORDER BY group_name ASC
```

**Display Format:**
- `[Group Name] (type)`
- Example: "Happy Kids K2 (group)"

### UI Behavior

1. **Focus on Input** → แสดง dropdown ทันที
2. **Type to Search** → กรองรายการแบบ real-time
3. **Click Item** → เลือก ID ลงในช่อง input
4. **Blur (Click Outside)** → ซ่อน dropdown (delay 200ms เพื่อให้คลิกได้)

### Search Algorithm

ค้นหาทั้ง **ID** และ **Label**:
```typescript
recipients.filter(r => 
  r.id.toLowerCase().includes(search) || 
  r.label.toLowerCase().includes(search)
)
```

**ตัวอย่างการค้นหา:**
- พิมพ์ `U12` → เจอ User IDs ที่ขึ้นต้นด้วย U12
- พิมพ์ `สมชาย` → เจอ Users ที่ชื่อสมชาย
- พิมพ์ `K2` → เจอ Groups ที่มี K2 ในชื่อ
- พิมพ์ `parent` → เจอ Users ที่เป็น parent

## UI Design

### Dropdown Style
```css
- Background: White
- Border: 1px solid #E5E7EB
- Border Radius: 8px
- Max Height: 300px (scrollable)
- Box Shadow: 0 4px 12px rgba(0,0,0,0.1)
- Z-Index: 1000
```

### Item Style
```css
- Padding: 10px 14px
- Border Bottom: 1px solid #F3F4F6
- Hover: Background #F9FAFB
- Cursor: pointer
```

### Badge Colors
- **USER**: Blue (`#DBEAFE` background, `#1E40AF` text)
- **GROUP**: Green (`#D1FAE5` background, `#065F46` text)

## Component Structure

### State Variables
```typescript
const [recipients, setRecipients] = useState<Recipient[]>([]);
const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
const [testUserId, setTestUserId] = useState('');
```

### Interface
```typescript
interface Recipient {
  id: string;           // LINE User ID หรือ Group ID
  label: string;        // ชื่อที่แสดง (พร้อม role/type)
  type: 'user' | 'group';
  role?: string;        // สำหรับ user
  groupType?: string;   // สำหรับ group
}
```

### Functions
1. `loadRecipients()` - โหลดข้อมูลจาก API
2. `selectRecipient(recipient)` - เลือก recipient จาก dropdown
3. `useEffect()` - กรองรายการเมื่อ input เปลี่ยน

## Usage Example

### 1. เปิดหน้า
```
1. ไปที่ /admin/line-messages
2. Tab "ส่งข้อความ"
3. คลิกที่ช่อง "LINE User ID / Group ID"
```

### 2. ค้นหา
```
- พิมพ์ชื่อ: "สมชาย" → เห็นรายชื่อที่ตรงกัน
- พิมพ์ role: "parent" → เห็นเฉพาะ parents
- พิมพ์ ID: "U12" → เห็น User IDs ที่ตรง
```

### 3. เลือก
```
- คลิกที่รายการที่ต้องการ
- ID จะถูกใส่ลงในช่อง input อัตโนมัติ
- พร้อมส่งข้อความ!
```

## Files Modified

### New Files
1. `app/api/line/recipients/route.ts` - API endpoint สำหรับดึงข้อมูล

### Modified Files
1. `app/admin/line-messages/page.tsx`
   - เพิ่ม state สำหรับ recipients และ dropdown
   - เพิ่ม useEffect สำหรับกรองข้อมูล
   - เพิ่ม UI dropdown พร้อม styling
   - เพิ่ม functions สำหรับจัดการ selection

## Testing

### Test Cases

#### 1. Load Recipients
```bash
curl http://localhost:3000/api/line/recipients
```
**Expected:** ได้รายการ users และ groups

#### 2. Search Functionality
- พิมพ์ชื่อบางส่วน → เห็นรายการกรอง
- พิมพ์ ID บางส่วน → เห็นรายการกรอง
- ล้างช่อง → เห็นรายการทั้งหมด

#### 3. Selection
- คลิกรายการ → ID ถูกใส่ลงช่อง input
- Dropdown ปิดอัตโนมัติ

#### 4. Dropdown Behavior
- Focus → เปิด dropdown
- Click outside → ปิด dropdown
- Click item → เลือกและปิด dropdown

## Performance Considerations

### Optimization
1. **Client-side filtering** - กรองข้อมูลฝั่ง frontend (fast)
2. **Single API call** - โหลดข้อมูลครั้งเดียวตอนเริ่มต้น
3. **Debounce** - ไม่ใช้ debounce เพราะกรอง client-side (instant)
4. **Max height** - dropdown scrollable (300px) เพื่อไม่ให้ยาวเกิน

### Scalability
- **Small dataset** (< 1000 items) → Client-side filtering OK
- **Large dataset** (> 1000 items) → ควรเปลี่ยนเป็น server-side search

**Current approach:** Client-side (suitable สำหรับโรงเรียนขนาดเล็ก-กลาง)

## Future Enhancements

### Nice to Have
1. **Keyboard navigation** - Arrow keys เลื่อน, Enter เลือก
2. **Recent selections** - แสดงรายการที่ส่งล่าสุด
3. **Favorites** - Pin รายการที่ใช้บ่อย
4. **Multi-select** - ส่งหลายคนพร้อมกัน
5. **Group members preview** - แสดงจำนวนสมาชิกในกลุ่ม
6. **Status indicator** - แสดงว่า online/offline
7. **Virtual scrolling** - สำหรับรายการเยอะๆ
8. **Server-side search** - พร้อม pagination

## Troubleshooting

### Dropdown ไม่เปิด
- ตรวจสอบว่า API `/api/line/recipients` ทำงาน
- เช็ค console สำหรับ errors
- Refresh page ใหม่

### ไม่เห็นรายการ
- ตรวจสอบว่ามี users/groups ที่ `status = 'active'`
- ตรวจสอบว่า `line_user_id` หรือ `line_group_id` ไม่เป็น NULL

### Search ไม่ทำงาน
- ตรวจสอบ logic ใน `useEffect` ที่กรองข้อมูล
- ดู `filteredRecipients` state ใน React DevTools

## Database Requirements

### Required Tables
1. **app_user** - ต้องมี users ที่:
   - `line_user_id IS NOT NULL`
   - `status = 'active'`
   - `display_name` หรือ `line_display_name` มีค่า

2. **line_groups** - ต้องมี groups ที่:
   - `status = 'active'`
   - `group_name` มีค่า

### Sample Data
ถ้าไม่มีข้อมูล ให้รัน:
```sql
-- Insert test user
INSERT INTO app_user (id, line_user_id, role, status, display_name)
VALUES (gen_random_uuid(), 'U1234567890test', 'parent', 'active', 'Test Parent');

-- Insert test group
INSERT INTO line_groups (line_group_id, group_name, status)
VALUES ('C1234567890test', 'Test Group', 'active');
```

## Summary

✅ **Autocomplete dropdown** พร้อมใช้งาน  
✅ **แสดงทั้ง Users และ Groups**  
✅ **Search real-time** (by name or ID)  
✅ **Beautiful UI** with icons and badges  
✅ **Easy to use** - click to select  
✅ **No TypeScript errors**  

---

**Status:** ✅ Complete  
**API:** `GET /api/line/recipients`  
**Page:** `/admin/line-messages` (Tab: ส่งข้อความ)  
**Files:** 2 modified, 1 new  
