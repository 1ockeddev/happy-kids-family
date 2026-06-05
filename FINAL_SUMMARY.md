# สรุปสุดท้าย - Teacher Mode Implementation

## ✅ เสร็จสมบูรณ์แล้ว:

1. **หน้าแรก (`/page.tsx`)** ✅
   - แถวบน: selector นักเรียนทั้งหมด
   - Two-way selector เมื่อเลือกแล้ว
   - Reset state เมื่อเปลี่ยนเด็ก
   - Calendar auto-scroll แก้ไขแล้ว

2. **AppHeader Component** ✅
   - รองรับ Teacher Mode เต็มรูปแบบ
   - Two-way selector (ผู้ปกครอง ❤️ นักเรียน)
   - ใช้ได้ทุกหน้า

3. **API Routes** ✅
   - `/api/children` - รองรับฟิลด์ใหม่ + `birthdate::text`
   - `/api/children/[id]` - GET/PATCH รองรับฟิลด์ใหม่
   - `/api/enrollments` - รองรับฟิลด์ใหม่ทั้งหมด

4. **`/summary-behavior`** ✅
   - เพิ่ม `currentUser` state
   - LIFF useEffect รองรับ Teacher
   - Parent loading รองรับ Teacher
   - ใช้ AppHeader component

5. **`/summary-food-milk`** ✅ (บางส่วน)
   - เริ่มแก้ไขแล้ว ต้องแก้ต่อเหมือน summary-behavior

6. **Database Migration** ✅
   - SQL พร้อม run: `migrations/add_child_name_fields.sql`

---

## 🔧 ต้องทำต่อ (ด่วน):

### หน้าที่ต้องแก้ให้เหมือน `/summary-behavior`:

1. **`/summary-food-milk/page.tsx`** - เริ่มแล้วต้องทำต่อ
2. **`/summary-nap/page.tsx`** - ยังไม่เริ่ม
3. **`/summary-excretion/page.tsx`** - ยังไม่เริ่ม

### สิ่งที่ต้องทำในแต่ละหน้า (ทำเหมือน summary-behavior):

#### A. ส่วนบน (imports & helpers):
```typescript
import AppHeader from '@/components/AppHeader';

const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
```

#### B. เพิ่ม state:
```typescript
const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
```

#### C. แก้ LIFF useEffect (บรรทัด ~50-85):
```typescript
useEffect(() => {
  if (!liff.ready) return;
  
  if (!liff.profile?.userId) {
    fetch('/api/report/children').then(r=>r.json()).then(j=>{
      setChildren(j.data??[]);
    });
    return;
  }
  
  setChildLoading(true);
  fetch('/api/auth/line-register',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      line_user_id:liff.profile.userId,
      display_name:liff.profile.displayName,
      picture_url:liff.profile.pictureUrl??null
    })
  })
  .then(r=>r.json())
  .then(async regJson => {
    if (regJson.status === 403) {
      setNotRegistered(true);
      return;
    }
    const user = regJson.data;
    setCurrentUser(user); // ← ADD
    
    if (user?.role === 'teacher') {
      // ← CHANGE: เปลี่ยนจาก router.replace
      const childRes = await fetch('/api/children');
      const childJson = await childRes.json();
      setChildren(childJson.data ?? []);
    } else {
      const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
      const childJson = await childRes.json();
      const kids:Child[] = childJson.data??[];
      setChildren(kids);
      if (kids.length===0) setNotRegistered(true);
    }
  })
  .catch(()=>setNotRegistered(true))
  .finally(()=>setChildLoading(false));
},[liff.ready,liff.profile?.userId]);
```

#### D. แก้ parent loading useEffect (บรรทัด ~110-135):
```typescript
useEffect(()=>{
  // ← ADD these 4 lines
  if (currentUser?.role === 'teacher' && !childId) {
    setParents([]);
    setParentId(null);
    return;
  }
  
  if (!childId) { 
    setParents([]); 
    setParentId(null); 
    hasRestoredParent.current = false;
    return; 
  }
  let cancelled = false;
  fetch(`/api/report/child-parents?child_id=${childId}`).then(r=>r.json())
    .then(j=>{
      if (!cancelled) {
        const parentsList = j.data ?? [];
        setParents(parentsList);
        
        const savedParentId = localStorage.getItem('selectedParentId');
        if (savedParentId && parentsList.find((p: AppUser) => p.id === savedParentId)) {
          setParentId(savedParentId);
        }
        
        hasInitialized.current = true;
      }
    });
  return () => { cancelled = true; };
},[childId, currentUser]); // ← ADD currentUser
```

#### E. แทนที่ <header> ด้วย AppHeader:
**หา:**
```typescript
<header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
  {/* ... ทั้ง section ... */}
</header>
```

**แทนด้วย:**
```typescript
<AppHeader
  parents={parents}
  children={children}
  parentId={parentId}
  childId={childId}
  childLoading={childLoading}
  currentUser={currentUser}
  onParentSelect={setParentId}
  onChildSelect={setChildId}
  subtitle={enrollmentPeriod ? `${parseLocalDate(enrollmentPeriod.start).toLocaleDateString('th-TH')} - ${enrollmentPeriod.end ? parseLocalDate(enrollmentPeriod.end).toLocaleDateString('th-TH') : 'ปัจจุบัน'}` : undefined}
/>
```

#### F. ลบ Avatar, SkRow, SkCircle components (ถ้ามี):
เพราะ AppHeader มีให้แล้ว

---

## 🧪 Testing Checklist:

### Parent Mode:
- [ ] เห็น two-way selector
- [ ] เลือกผู้ปกครอง → เห็นลูก
- [ ] เปลี่ยนหน้า → ข้อมูลคงอยู่
- [ ] ทุกหน้า summary ทำงานเหมือนเดิม

### Teacher Mode:
- [ ] หน้าแรก: เห็นแถวบน + two-way selector
- [ ] เลือกนักเรียน → เห็นผู้ปกครอง
- [ ] เปลี่ยนหน้า summary → ข้อมูลคงอยู่
- [ ] สลับนักเรียนจากแถวบน → ผู้ปกครองเปลี่ยนตาม
- [ ] ทุกหน้า summary มี header เหมือนกัน

---

## 🚀 คำสั่ง Build & Run:

```bash
# Build
npm run build

# หากมี error ตรวจสอบ:
# 1. imports ถูกต้องหรือไม่
# 2. parseLocalDate มีในทุกไฟล์หรือไม่
# 3. currentUser dependency ใน useEffect ครบหรือไม่

# Run locally
npm run dev
```

---

## 📊 Progress:

- หน้าแรก: ✅ 100%
- AppHeader: ✅ 100%
- API Routes: ✅ 100%
- summary-behavior: ✅ 100%
- summary-food-milk: 🔶 50%
- summary-nap: ⬜ 0%
- summary-excretion: ⬜ 0%

**รวม: 5.5/8 = 69% เสร็จ**

---

## 📝 ไฟล์อ้างอิง:

- Pattern ที่ถูกต้อง: `/app/summary-behavior/page.tsx`
- Header Component: `/components/AppHeader.tsx`
- Main Page (ตัวอย่างเต็ม): `/app/page.tsx`

---

## ⚠️ สิ่งที่ต้องระวัง:

1. **อย่าลืม import AppHeader**
2. **อย่าลืมเพิ่ม parseLocalDate helper**
3. **ต้องเพิ่ม currentUser ใน dependency array ของ parent useEffect**
4. **ลบ Avatar/SkRow/SkCircle ถ้าไม่ได้ใช้ที่อื่น**
5. **ต้อง cast birthdate::text ใน SQL queries**
