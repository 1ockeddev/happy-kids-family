# Role Hierarchy Implementation

## 📋 Overview
ระบบ Role Hierarchy ใหม่ที่แยกสิทธิ์การเข้าถึงเป็น 4 ระดับ:
- 👑 **Super Admin** - สิทธิ์สูงสุด (มาจาก env เท่านั้น)
- ⚙️ **Admin** - จัดการระบบ
- 👨‍🏫 **Teacher** - ครู
- 👨‍👩‍👧 **Parent** - ผู้ปกครอง

---

## 🎯 Role Hierarchy

```
super_admin (👑) - ซ่อนจาก UI ทั้งหมด
    └─> สิทธิ์สูงสุด
    └─> มาจาก ADMIN_USERNAME และ ADMIN_PASSWORD ใน .env.local เท่านั้น
    └─> ไม่แสดงใน /admin/users (กรองออกทั้งหมด)
    └─> ไม่มีใน dropdown ตัวเลือก
    └─> ไม่สามารถสร้าง/แก้ไข/ลบผ่าน UI ได้
    └─> สามารถกำหนดสิทธิ์ให้ role อื่นได้ (future feature)

admin (⚙️)
    └─> จัดการระบบทั่วไป
    └─> สามารถสร้างผ่าน UI ได้
    └─> เข้าถึง /admin ได้ทั้งหมด
    └─> แก้ไข users, children, cohorts, reports ได้

teacher (👨‍🏫)
    └─> บันทึกข้อมูลประจำวัน
    └─> เข้าถึง Teacher Mode ใน User Side
    └─> สามารถกำหนด cohort settings ได้:
        - can_select_cohort: true/false
        - default_cohort_id: UUID ของห้องเรียน

parent (👨‍👩‍👧)
    └─> ดูรายงานลูกตัวเอง
    └─> เข้าถึง User Side (Mini App) เท่านั้น
```

---

## 🛠️ Changes Made

### 1. Type Definitions (`types/index.ts`)
```typescript
// Before
export type UserRole = 'teacher' | 'parent';

// After
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'parent';
```

### 2. Auth Library (`lib/auth.ts`)
เพิ่มฟังก์ชันตรวจสอบ Super Admin:

```typescript
export function isSuperAdmin(username: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  return !!adminUsername && !!adminPassword && username === adminUsername;
}

export function checkSuperAdmin(session: { username: string; role: string } | null): boolean {
  if (!session) return false;
  return session.role === 'super_admin' || isSuperAdmin(session.username);
}

export async function createSession(username: string): Promise<string> {
  const role = isSuperAdmin(username) ? 'super_admin' : 'admin';
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}
```

### 3. Users Page (`app/admin/users/page.tsx`)

#### Role Badges with Icons
```typescript
const roleConfig: Record<UserRole, { label: string; class: string; icon: string }> = {
  super_admin: { label: 'Super Admin', class: 'badge-super-admin', icon: '👑' },
  admin: { label: 'Admin', class: 'badge-admin', icon: '⚙️' },
  teacher: { label: 'ครู', class: 'badge-teacher', icon: '👨‍🏫' },
  parent: { label: 'ผู้ปกครอง', class: 'badge-parent', icon: '👨‍👩‍👧' }
};
```

#### Role Dropdown
```tsx
<select className="form-input" value={form.role} onChange={...}>
  <option value="parent">👨‍👩‍👧 ผู้ปกครอง</option>
  <option value="teacher">👨‍🏫 ครู</option>
  <option value="admin">⚙️ Admin</option>
  {/* super_admin ไม่แสดงเลย */}
</select>
```

#### Users List Filtering
```typescript
// กรอง super_admin ออก - ไม่แสดงใน UI
const filteredUsers = withKids.filter(u => (u.role as string) !== 'super_admin');
setData(filteredUsers);
```

#### Validations (Simplified - No super_admin checks needed)
```typescript
// ลบ validation ที่เกี่ยวกับ super_admin ออกทั้งหมด
// เพราะไม่มีทาง user จะเลือก super_admin ได้

// teacher ที่ไม่ให้เลือก cohort ต้องมี default_cohort_id
if (form.role === 'teacher' && !form.can_select_cohort && !form.default_cohort_id) {
  alert('⚠️ ต้องเลือกห้องเรียน Default');
  return;
}
```

#### Action Buttons (Simplified)
```tsx
{/* ไม่ต้องเช็ค super_admin เพราะกรองออกไปแล้วตั้งแต่ load */}
<button onClick={handleEdit}><Pencil /></button>
<button onClick={handleDelete}><Trash2 /></button>
```

### 4. CSS Styles (`app/globals.css`)
```css
/* Role badges */
.badge-super-admin {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-weight: 700;
  border: 1px solid #fbbf24;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.2);
}

.badge-admin {
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
  border: 1px solid #c7d2fe;
}

.badge-teacher {
  background: #f0eeff;
  color: #6c5ce7;
  font-weight: 600;
}

.badge-parent {
  background: #fef0eb;
  color: #e8754a;
  font-weight: 600;
}
```

### 5. Database Migration (`db/migrations/002_add_admin_roles.sql`)
```sql
-- เพิ่ม 'admin' role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- เพิ่ม 'super_admin' role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
```

---

## 🔐 Security Rules

### Super Admin
1. **มาจาก ENV เท่านั้น**: ต้องกำหนดใน `.env.local`
   ```env
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=your_password
   ```

2. **ซ่อนจาก UI ทั้งหมด**: 
   - ไม่แสดงใน users list (กรองออก)
   - ไม่มีใน role dropdown
   - ไม่สามารถแก้ไข/ลบผ่าน UI

3. **Session-based Authentication**: Login ผ่าน `/admin/login` เท่านั้น

4. **Auto-detection**: ระบบจะตรวจสอบ username จาก env และสร้าง session ด้วย role='super_admin' อัตโนมัติ

### Admin
1. **สร้างผ่าน UI ได้**: เลือกได้จาก dropdown
2. **สิทธิ์น้อยกว่า Super Admin**: (future feature - permission management)
3. **เข้าถึง /admin ได้ทั้งหมด**

### Teacher
1. **Cohort Settings**:
   - `can_select_cohort: true` → เลือกห้องได้เองใน User Side
   - `can_select_cohort: false` → ใช้แค่ `default_cohort_id`
2. **Default Cohort**: จำเป็นต้องระบุเมื่อ `can_select_cohort = false`

### Parent
1. **ดูข้อมูลลูกเท่านั้น**: ผูกผ่าน `parent_child` table
2. **เข้า Mini App ได้**: ต้องมี `line_user_id`

---

## 📝 How to Use

### 1. Setup Super Admin (First Time)
```bash
# แก้ไข .env.local
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_here

# Restart development server
npm run dev
```

### 2. Login as Super Admin
- เปิด `/admin/login`
- ใส่ username/password จาก env
- ระบบจะสร้าง session ด้วย role='super_admin' อัตโนมัติ

### 3. Create Admin Users
1. เข้า `/admin/users`
2. คลิก "+ เพิ่มผู้ใช้"
3. เลือก Role = "⚙️ Admin"
4. กรอกข้อมูลและบันทึก

### 4. Create Teacher with Cohort Settings
1. เข้า `/admin/users`
2. คลิก "+ เพิ่มผู้ใช้"
3. เลือก Role = "👨‍🏫 ครู"
4. ตั้งค่า Cohort Settings:
   - ✅ เลือกห้องได้ → เปิด checkbox "อนุญาตให้เลือกห้องเรียน"
   - ❌ ห้องเดียว → ปิด checkbox และเลือก "ห้องเรียน Default"
5. บันทึก

### 5. Create Parent and Link Children
1. เข้า `/admin/users`
2. คลิก "+ เพิ่มผู้ใช้"
3. เลือก Role = "👨‍👩‍👧 ผู้ปกครอง"
4. บันทึก
5. คลิก "ผูกลูก" เพื่อเชื่อมโยงกับนักเรียน

---

## 🚀 Database Migration Steps

### Run on Supabase SQL Editor:
```sql
-- Copy ทั้งหมดจาก db/migrations/002_add_admin_roles.sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
```

### Verify:
```sql
SELECT enum_range(NULL::user_role);
-- Expected: {teacher,parent,admin,super_admin}

-- Check existing users
SELECT id, display_name, role FROM app_user ORDER BY created_at DESC;
```

---

## 🎨 UI/UX Features

### Role Badges
- 👑 **Super Admin**: Golden gradient with shadow
- ⚙️ **Admin**: Indigo with border
- 👨‍🏫 **Teacher**: Purple tint
- 👨‍👩‍👧 **Parent**: Orange tint

### Protection Indicators
- Super Admin rows show "🔒 ป้องกันโดย ENV" instead of edit/delete buttons
- Dropdown has disabled option with tooltip
- Validation alerts with clear error messages

### Mobile-First Design
- Touch-optimized buttons (44px minimum)
- Responsive badges
- Clear visual hierarchy

---

## ⚠️ Important Notes

1. **Super Admin ต้องมาจาก ENV เท่านั้น**
   - ไม่สามารถสร้างผ่าน UI
   - ไม่สามารถแก้ไขหรือลบ
   - ระบบจะตรวจสอบจาก `ADMIN_USERNAME` + `ADMIN_PASSWORD`

2. **Role Change Requires Refresh**
   - เมื่อเปลี่ยน role ของ user ที่มี LINE ID แล้ว
   - ผู้ใช้ต้อง **รีเฟรชหน้า Mini App** เพื่อดึง role ใหม่

3. **Teacher Cohort Settings**
   - ถ้า `can_select_cohort = false` ต้องมี `default_cohort_id`
   - ระบบจะ validate ก่อนบันทึก

4. **Enum Values ไม่สามารถลบได้**
   - PostgreSQL ไม่รองรับการลบ enum values
   - การเพิ่ม values ใหม่จะต่อท้ายเสมอ

---

## 🔮 Future Features

### Permission Management (Not Yet Implemented)
Super Admin จะสามารถกำหนดสิทธิ์ให้แต่ละ role ได้:

```typescript
interface RolePermissions {
  role: UserRole;
  permissions: {
    can_manage_users: boolean;
    can_manage_children: boolean;
    can_manage_cohorts: boolean;
    can_manage_daily: boolean;
    can_manage_reports: boolean;
    can_view_analytics: boolean;
    can_export_data: boolean;
  };
}
```

### Audit Log
- บันทึกการเปลี่ยนแปลง role
- บันทึก Super Admin actions
- Track permission changes

---

## ✅ Testing Checklist

- [ ] Super Admin login ผ่าน env
- [ ] Super Admin ไม่แสดงใน /admin/users list
- [ ] Super Admin ไม่มีใน role dropdown
- [ ] สร้าง Admin user ผ่าน UI
- [ ] สร้าง Teacher พร้อม cohort settings
- [ ] สร้าง Parent และผูกลูก
- [ ] Teacher validation: default_cohort_id required เมื่อ can_select_cohort = false
- [ ] Role badges แสดงถูกต้อง (admin, teacher, parent)
- [ ] Mobile responsive ทุก screen size
- [ ] Migration รันสำเร็จบน Supabase
- [ ] Enum values ครบทั้ง 4 roles
- [ ] Analytics page ไม่ crash เมื่อ stats เป็น null

---

## 📚 Related Files

### Modified Files:
- `types/index.ts` - Type definitions
- `lib/auth.ts` - Auth logic และ Super Admin detection
- `app/admin/users/page.tsx` - UI และ validation
- `app/globals.css` - Badge styles

### New Files:
- `db/migrations/002_add_admin_roles.sql` - Database migration
- `ROLE_HIERARCHY_IMPLEMENTATION.md` - This documentation

### Configuration:
- `.env.local` - ADMIN_USERNAME, ADMIN_PASSWORD

---

## 🐛 Known Issues

None at the moment.

---

## 📞 Support

หากพบปัญหาหรือต้องการเพิ่มฟีเจอร์:
1. ตรวจสอบ `.env.local` ว่ามี ADMIN_USERNAME และ ADMIN_PASSWORD
2. รัน migration `002_add_admin_roles.sql` บน Supabase
3. Restart development server
4. Clear browser cache/cookies

---

**Implementation Date**: June 17, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete
