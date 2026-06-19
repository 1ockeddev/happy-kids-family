# 🧹 Cleanup Unused Files

## ไฟล์ที่แนะนำให้ลบ

### 1. เอกสาร Implementation เก่า (Completed)
เอกสารเหล่านี้เป็นบันทึกการทำงานที่เสร็จแล้ว สามารถลบได้:

```bash
# ลบเอกสาร implementation ที่เสร็จแล้ว
rm ACTIVITY_LOG_IMPLEMENTATION.md
rm CLIENT_NAVIGATION_MIGRATION.md
rm COHORT_SELECTOR_IMPLEMENTATION.md
rm DAILY_REPORT_UPDATE.md
rm DESIGN_SYSTEM_ICONS.md
rm DESIGN_SYSTEM_IMPLEMENTATION_SUMMARY.md
rm LOADING_PATTERN.md
rm MIGRATION_INSTRUCTIONS.md
rm MOBILE_FIRST_ADMIN.md
rm NAP_NOTE_UPDATE.md
rm TEACHER_COHORT_SETTINGS.md
rm TEACHER_MODE_SUMMARY_UPDATE.md
rm UPDATE_SUMMARY_PAGES.md
rm USERS_PAGE_TABS_UPDATE.md
rm VERCEL_TIMEOUT_FIX.md
```

### 2. ไฟล์เปล่าหรือไม่มีเนื้อหา
```bash
# ลบไฟล์ที่มีแค่ reference
rm CLAUDE.md  # มีแค่ @AGENTS.md
```

### 3. เอกสารที่รวมเข้า README แล้ว
```bash
# ถ้า FINAL_SUMMARY.md รวมเข้า README แล้ว
rm FINAL_SUMMARY.md
```

## ไฟล์ที่ควรเก็บไว้

### เอกสารสำคัญ:
- ✅ **README.md** - เอกสารหลักของโปรเจกต์
- ✅ **AGENTS.md** - คำแนะนำสำหรับ AI agents
- ✅ **HOME_PAGE_REFACTOR.md** - สถานะ refactor ปัจจุบัน
- ✅ **ROLE_HIERARCHY_IMPLEMENTATION.md** - การทำงานของ roles
- ✅ **RUN_MIGRATION_NOW.md** - วิธีรัน migrations
- ✅ **SUPABASE_CONNECTION_FIX.md** - แก้ปัญหา Supabase

### คู่มือการใช้งาน:
- ✅ **ANALYTICS_SYSTEM.md** - ระบบ analytics
- ✅ **BATCH_IMPORT_GUIDE.md** - การ import ข้อมูล
- ✅ **USER_MANAGEMENT_GUIDE.md** - การจัดการ users

## 🗂️ โครงสร้างเอกสารที่แนะนำ

```
/
├── README.md                          # เอกสารหลัก
├── AGENTS.md                          # คำแนะนำ AI
├── HOME_PAGE_REFACTOR.md             # Refactor status
│
├── docs/                              # เอกสารอ้างอิง
│   ├── ANALYTICS_SYSTEM.md
│   ├── BATCH_IMPORT_GUIDE.md
│   ├── USER_MANAGEMENT_GUIDE.md
│   ├── ROLE_HIERARCHY.md
│   └── SUPABASE_SETUP.md
│
└── migrations/
    └── RUN_MIGRATION_NOW.md
```

## คำสั่งลบแบบปลอดภัย

### ขั้นตอนที่ 1: สำรองไฟล์ก่อน
```bash
# สร้างโฟลเดอร์สำรอง
mkdir -p .archive/implementation-docs

# ย้ายไฟล์เก่าไปสำรอง
mv *_IMPLEMENTATION.md .archive/implementation-docs/ 2>/dev/null || true
mv *_UPDATE.md .archive/implementation-docs/ 2>/dev/null || true
mv *_FIX.md .archive/implementation-docs/ 2>/dev/null || true
mv *_MIGRATION.md .archive/implementation-docs/ 2>/dev/null || true
```

### ขั้นตอนที่ 2: จัดระเบียบเอกสารที่เหลือ
```bash
# สร้างโฟลเดอร์ docs
mkdir -p docs

# ย้ายคู่มือการใช้งาน
mv ANALYTICS_SYSTEM.md docs/
mv BATCH_IMPORT_GUIDE.md docs/
mv USER_MANAGEMENT_GUIDE.md docs/
mv ROLE_HIERARCHY_IMPLEMENTATION.md docs/ROLE_HIERARCHY.md
mv SUPABASE_CONNECTION_FIX.md docs/SUPABASE_SETUP.md
```

### ขั้นตอนที่ 3: อัปเดต README
เพิ่ม links ไปยังเอกสารในโฟลเดอร์ docs:

```markdown
## 📚 Documentation

- [Analytics System](docs/ANALYTICS_SYSTEM.md)
- [Batch Import Guide](docs/BATCH_IMPORT_GUIDE.md)
- [User Management](docs/USER_MANAGEMENT_GUIDE.md)
- [Role Hierarchy](docs/ROLE_HIERARCHY.md)
- [Supabase Setup](docs/SUPABASE_SETUP.md)
```

## ✅ ผลลัพธ์ที่คาดหวัง

### ก่อนทำความสะอาด:
```
- 27 ไฟล์ .md ใน root
- ยากต่อการหาเอกสาร
- มีเอกสารเก่าปะปนอยู่
```

### หลังทำความสะอาด:
```
- 6-8 ไฟล์ .md ใน root (เอกสารสำคัญ)
- เอกสารอ้างอิงอยู่ใน docs/
- เอกสารเก่าสำรองไว้ใน .archive/
```

## ⚠️ คำเตือน

1. **ตรวจสอบก่อนลบ** - อ่านเนื้อหาแต่ละไฟล์ก่อนลบ
2. **สำรองก่อน** - ย้ายไปไว้ใน .archive/ ก่อน
3. **ทดสอบ** - ตรวจสอบว่า links ใน README ยังใช้งานได้

---

**สถานะ**: Draft - รอการอนุมัติก่อนดำเนินการ
**วันที่สร้าง**: 2026-06-17
