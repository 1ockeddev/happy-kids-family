# Teacher Mode - Summary Pages Update Guide

## ✅ Completed:
1. **AppHeader Component** (`components/AppHeader.tsx`)
   - รองรับ Teacher Mode เต็มรูปแบบ
   - แสดงแถวบน selector นักเรียนทั้งหมด (Teacher Mode)
   - แสดง two-way selector (ผู้ปกครอง ❤️ นักเรียน) เมื่อเลือกแล้ว
   - รองรับทั้ง Parent และ Teacher Mode

## 🔧 ต้องอัปเดตหน้าต่อไปนี้:

### 1. `/summary-behavior`
### 2. `/summary-food-milk`
### 3. `/summary-nap`
### 4. `/summary-excretion`

---

## การเปลี่ยนแปลงที่ต้องทำในแต่ละหน้า:

### A. เพิ่ม state สำหรับ currentUser
```typescript
const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
```

### B. อัปเดต useEffect สำหรับ LIFF ready

**เดิม (Parent Mode Only):**
```typescript
useEffect(() => {
  if (!liff.ready) return;
  if (!liff.profile?.userId) {
    // โหลดจาก mock
    fetch('/api/report/children').then(...);
    return;
  }
  
  // Line register
  fetch('/api/auth/line-register', {...})
    .then(regJson => {
      const user = regJson.data;
      if (user?.role === 'teacher') {
        router.replace('/admin/users'); // ไล่ครูออก
        return;
      }
      // โหลดลูก
      fetch(`/api/report/line-children?...`)...
    });
}, [liff.ready]);
```

**ใหม่ (รองรับ Teacher Mode):**
```typescript
useEffect(() => {
  if (!liff.ready) return;
  
  if (!liff.profile?.userId) {
    // Development mode - โหลด mock
    fetch('/api/report/children').then(r => r.json()).then(j => {
      setChildren(j.data ?? []);
    });
    return;
  }
  
  setChildLoading(true);
  
  fetch('/api/auth/line-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_user_id: liff.profile.userId,
      display_name: liff.profile.displayName,
      picture_url: liff.profile.pictureUrl ?? null
    })
  })
    .then(r => r.json())
    .then(async regJson => {
      if (regJson.status === 403) {
        setNotRegistered(true);
        return;
      }
      
      const user = regJson.data;
      setCurrentUser(user); // ✅ เซ็ต currentUser
      
      if (user?.role === 'teacher') {
        // ✅ Teacher: โหลดนักเรียนทั้งหมด
        const childRes = await fetch('/api/children');
        const childJson = await childRes.json();
        setChildren(childJson.data ?? []);
      } else {
        // Parent: โหลดแค่ลูกของตัวเอง
        const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
        const childJson = await childRes.json();
        const kids: Child[] = childJson.data ?? [];
        setChildren(kids);
        if (kids.length === 0) setNotRegistered(true);
      }
    })
    .catch(() => setNotRegistered(true))
    .finally(() => setChildLoading(false));
}, [liff.ready, liff.profile?.userId]);
```

### C. อัปเดต useEffect สำหรับโหลด parents

**เพิ่มเงื่อนไขสำหรับ Teacher Mode:**

```typescript
useEffect(() => {
  // ถ้าเป็น teacher แต่ยังไม่ได้เลือกนักเรียน ไม่ต้องโหลด parents
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
  fetch(`/api/report/child-parents?child_id=${childId}`)
    .then(r => r.json())
    .then(j => {
      if (!cancelled) {
        const parentsList = j.data ?? [];
        setParents(parentsList);
        
        // Restore from localStorage
        const savedParentId = localStorage.getItem('selectedParentId');
        if (savedParentId && parentsList.find((p: AppUser) => p.id === savedParentId)) {
          setParentId(savedParentId);
        }
        
        hasInitialized.current = true;
      }
    });
  
  return () => { cancelled = true; };
}, [childId, currentUser]);
```

### D. อัปเดต AppHeader usage

**เพิ่ม prop `currentUser`:**

```typescript
<AppHeader
  parents={parents}
  children={children}
  parentId={parentId}
  childId={childId}
  childLoading={childLoading}
  currentUser={currentUser}  // ✅ เพิ่ม
  onParentSelect={setParentId}
  onChildSelect={setChildId}
  subtitle={enrollmentPeriod ? `${parseLocalDate(enrollmentPeriod.start).toLocaleDateString('th-TH')} - ${enrollmentPeriod.end ? parseLocalDate(enrollmentPeriod.end).toLocaleDateString('th-TH') : 'ปัจจุบัน'}` : undefined}
/>
```

---

## 📝 ตัวอย่างไฟล์ที่ต้องแก้

### ตัวอย่าง: `/summary-behavior/page.tsx`

**ส่วนที่ต้องแก้:**
1. เพิ่ม `import AppHeader from '@/components/AppHeader';`
2. เพิ่ม `const [currentUser, setCurrentUser] = useState<AppUser | null>(null);`
3. แก้ useEffect LIFF ready ตาม pattern ด้านบน
4. แก้ useEffect parent loading ตาม pattern ด้านบน
5. แทนที่ส่วน header เดิมด้วย `<AppHeader ... />`

---

## ✅ ผลลัพธ์ที่คาดหวัง:

### Teacher Mode:
1. แถวบน: เห็นนักเรียนทั้งหมด สลับได้
2. เมื่อเลือกแล้ว: แสดง two-way selector (ผู้ปกครอง ❤️ นักเรียนที่เลือก)
3. เปลี่ยนหน้าแล้วข้อมูลยังคงอยู่ (เพราะใช้ localStorage)

### Parent Mode:
1. แสดง two-way selector (ผู้ปกครอง ❤️ ลูก/หลาน)
2. ทำงานเหมือนเดิม ไม่เปลี่ยนแปลง

---

## 🚀 การทดสอบ:

1. **Parent Mode:**
   - เลือกผู้ปกครอง → เห็นลูกที่ผูก
   - เปลี่ยนหน้า summary → ข้อมูลยังคงอยู่

2. **Teacher Mode:**
   - แถวบนเห็นนักเรียนทั้งหมด
   - เลือกนักเรียน → เห็นผู้ปกครองของเขา
   - เปลี่ยนหน้า → นักเรียนและผู้ปกครองยังคงเลือกอยู่
   - สลับนักเรียนจากแถวบน → ผู้ปกครองเปลี่ยนตาม

---

## 📌 หมายเหตุสำคัญ:

- หน้าแรก (`/page.tsx`) ไม่ใช้ AppHeader แต่มี logic เดียวกัน (อัปเดตแล้ว)
- หน้า summary ทั้งหมดควรใช้ AppHeader component เพื่อความสอดคล้อง
- ต้องแก้ทั้ง 4 หน้า summary
