# สรุปการอัปเดต Summary Pages สำหรับ Teacher Mode

## ✅ เสร็จแล้ว:
- `/summary-behavior/page.tsx` ✅

## 📋 ยังต้องทำ (ใช้ pattern เดียวกัน):
- `/summary-food-milk/page.tsx`
- `/summary-nap/page.tsx`  
- `/summary-excretion/page.tsx`

---

## Pattern สำหรับแก้ไขทั้ง 3 หน้า:

### 1. เพิ่ม import AppHeader
```typescript
import AppHeader from '@/components/AppHeader';
```

### 2. เพิ่ม parseLocalDate helper
```typescript
const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
```

### 3. เพิ่ม currentUser state
```typescript
const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
```

### 4. แก้ useEffect LIFF ready
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
    setCurrentUser(user); // ✅ เพิ่มบรรทัดนี้
    
    if (user?.role === 'teacher') {
      // ✅ เปลี่ยนจาก router.replace('/admin/users') เป็น:
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

### 5. แก้ useEffect parent loading  
เพิ่มเงื่อนไขแรก:
```typescript
useEffect(()=>{
  // ✅ เพิ่ม 4 บรรทัดนี้
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
  // ... ส่วนอื่นเหมือนเดิม
},[childId, currentUser]); // ✅ เพิ่ม currentUser ใน dependency
```

### 6. แทนที่ <header> section ด้วย AppHeader

**ลบส่วนนี้:**
```typescript
<header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
  {/* ... ทั้ง header เดิม ... */}
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

---

## ตัวอย่างที่ครบถ้วนจาก summary-behavior:

ดูไฟล์ `/app/summary-behavior/page.tsx` เป็นตัวอย่างที่แก้ไขเสร็จสมบูรณ์แล้ว

---

## การทดสอบหลังแก้:

### Parent Mode:
1. เห็น two-way selector ปกติ
2. เปลี่ยนหน้าแล้วข้อมูลยังคงอยู่

### Teacher Mode:
1. เห็นแถวบนนักเรียนทั้งหมด
2. เลือกแล้วเห็น two-way selector  
3. เปลี่ยนหน้าข้อมูลยังคงอยู่
4. สลับนักเรียนได้จากแถวบน

---

## Build & Test:
```bash
npm run build
# ถ้า build ผ่าน ทดสอบบน browser ทั้ง parent และ teacher mode
```
