# คู่มือการใช้งาน Batch Import

## 🎯 ใช้เมื่อไหร่?

ใช้ **Batch Import** เมื่อ:
- ✅ ไฟล์มีข้อมูลมากกว่า 10,000 records
- ✅ Import ธรรมดา timeout (เกิน 60 วินาที)
- ✅ ต้องการเห็น progress แบบ real-time
- ✅ ต้องการให้ import ต่อแม้บาง table จะล้มเหลว

## 📋 วิธีใช้งาน

### Import ธรรมดา (ไฟล์เล็ก < 60 วินาที)

1. ไปที่ `/admin/database`
2. เลือกไฟล์ JSON จาก Export
3. กด **"วิเคราะห์ Conflict ก่อน import"**
4. ดู conflict report และเลือก table ที่ต้องการเขียนทับ
5. กด **"ยืนยัน Import"**

### Batch Import (ไฟล์ใหญ่ > 60 วินาที)

1. ไปที่ `/admin/database`
2. เลือกไฟล์ JSON จาก Export
3. กด **"วิเคราะห์ Conflict ก่อน import"**
4. ดู conflict report และเลือก table ที่ต้องการเขียนทับ
5. กด **"Batch Import (สำหรับไฟล์ใหญ่)"**
6. รอดู progress bar:
   ```
   กำลัง import ตารางที่ 5 / 14
   👧 นักเรียน
   [████████████░░░░░░░░] 35%
   ```

## ⚙️ วิธีทำงาน

### Import ธรรมดา
```
[Frontend] → [API] → [Database]
            ↓
        All tables
        at once
        (1 request)
```

**ข้อดี:**
- เร็วกว่าถ้าข้อมูลไม่เยอะ
- ใช้ transaction เดียว

**ข้อเสีย:**
- ❌ Timeout ถ้าข้อมูลเยอะ
- ❌ ไม่เห็น progress
- ❌ ถ้าล้มเหลว ต้องเริ่มใหม่ทั้งหมด

### Batch Import
```
[Frontend] → [API] → [Database]
   ↓           ↓
Table 1    Transaction 1
Table 2    Transaction 2
Table 3    Transaction 3
   ...        ...
```

**ข้อดี:**
- ✅ ไม่ timeout (แต่ละ request สั้น)
- ✅ แสดง progress real-time
- ✅ Table ที่สำเร็จจะถูกบันทึกแม้ table อื่นล้มเหลว
- ✅ ดู error แยกแต่ละ table ได้

**ข้อเสีย:**
- ช้ากว่าเล็กน้อย (multiple requests)
- ใช้ transaction หลายตัว

## 🔧 Technical Details

### API Endpoints

#### 1. `/api/db-import` (Import ธรรมดา)
- Import all tables ในครั้งเดียว
- Timeout: 60 วินาที
- Single transaction

#### 2. `/api/db-import-batch` (Batch Import)
- Import ทีละ table
- Timeout: 60 วินาที per table
- Multiple transactions

### Request Format (Batch)

```json
POST /api/db-import-batch
{
  "table": "child",
  "rows": [...],
  "overwrite": true
}
```

### Response Format

```json
{
  "data": {
    "stats": {
      "table": "child",
      "inserted": 150,
      "skipped": 20,
      "overwritten": 5,
      "conflicts": [],
      "errors": []
    }
  }
}
```

## 🎨 UI Features

### Progress Bar
- แสดง table ปัจจุบันที่กำลัง import
- แสดงเปอร์เซ็นต์ความสำเร็จ
- แสดงจำนวน table ที่เสร็จ / ทั้งหมด

### Result Display
- แสดงผลแยกแต่ละ table
- แสดงจำนวน: ใหม่, เขียนทับ, ข้าม
- แสดง errors แยกแต่ละ table (ถ้ามี)

## 🚀 Performance Tips

### สำหรับ Export ขนาดใหญ่

1. **Export แบบเลือก tables**
   - ไม่จำเป็นต้อง export ทุก table
   - เลือกเฉพาะ tables ที่ต้องการ

2. **Export เป็น CSV**
   - ขนาดไฟล์เล็กกว่า JSON
   - แต่ไม่สามารถ import ได้ (export อย่างเดียว)

3. **แบ่ง Export ตามช่วงเวลา**
   - Export ข้อมูลเก่าแยกจากข้อมูลใหม่
   - ใช้ filter ตาม date range

### สำหรับ Import ขนาดใหญ่

1. **ใช้ Batch Import**
   - เสถียรกว่าสำหรับข้อมูลมาก
   - มี progress feedback

2. **Import ตอนที่ traffic ต่ำ**
   - Import ช่วงกลางคืนหรือวันหยุด
   - ลดผลกระทบต่อ database performance

3. **ตรวจสอบ Database Connection Pool**
   ```env
   DATABASE_MAX_CONNECTIONS=10
   DATABASE_IDLE_TIMEOUT=30000
   ```

## 📊 Table Dependencies

Import ตาม order นี้เพื่อป้องกัน foreign key errors:

```
1. app_user           (ไม่มี dependencies)
2. child              (ไม่มี dependencies)
3. cohort             (ไม่มี dependencies)
4. parent_child       (depends on: app_user, child)
5. teacher_permission (depends on: app_user)
6. enrollment         (depends on: child, cohort)
7. daily              (depends on: cohort)
8. attendance         (depends on: daily, child)
9. daily_report       (depends on: daily, child)
10. behavior_category (depends on: cohort)
11. behavior_item     (depends on: behavior_category)
12. child_behavior_score (depends on: daily, child, behavior_item)
13. child_excretion   (depends on: daily, child)
14. holidays          (depends on: cohort - optional)
```

## ⚠️ ข้อควรระวัง

1. **Backup ก่อน Import**
   - Export ข้อมูลปัจจุบันก่อนทุกครั้ง
   - เก็บ backup ไว้หลายเวอร์ชัน

2. **ตรวจสอบ Conflict Report**
   - อ่าน conflict report ก่อน import
   - เข้าใจว่าจะเขียนทับอะไรบ้าง

3. **Test กับข้อมูลเล็กก่อน**
   - ทดสอบ import process กับข้อมูลตัวอย่าง
   - ตรวจสอบผลลัพธ์ก่อน import ข้อมูลจริงทั้งหมด

4. **Monitor Database Resources**
   - ตรวจสอบ CPU, Memory usage
   - ระวัง connection pool exhaustion

## 🐛 Troubleshooting

### Timeout แม้ใช้ Batch Import

**สาเหตุ:** Table มีข้อมูลมากเกินไป

**แก้ไข:**
1. แบ่ง export ออกเป็นหลายไฟล์
2. Export แต่ละไฟล์มี records น้อยกว่า 5,000 rows
3. Import ทีละไฟล์

### Foreign Key Constraint Error

**สาเหตุ:** Import table ผิด order

**แก้ไข:**
1. Import master tables ก่อน (app_user, child, cohort)
2. Import relation tables ทีหลัง (parent_child, enrollment)

### Duplicate Key Error

**สาเหตุ:** มี conflict แต่ไม่ได้เลือก overwrite

**แก้ไข:**
1. อ่าน conflict report
2. เลือก "เขียนทับ" สำหรับ tables ที่ต้องการ
3. Import ใหม่

## 📝 Best Practices

1. **Naming Convention**
   ```
   backup-{yyyy-mm-dd}-{environment}.json
   
   ✅ backup-2024-01-15-production.json
   ✅ backup-2024-01-15-staging.json
   ```

2. **Backup Schedule**
   - Daily: เก็บ 7 วัน
   - Weekly: เก็บ 4 สัปดาห์
   - Monthly: เก็บ 12 เดือน

3. **Test Restore**
   - ทดสอบ restore process เดือนละครั้ง
   - มั่นใจว่า backup ใช้งานได้จริง

4. **Documentation**
   - บันทึก import/export ที่ทำ
   - บันทึก errors และวิธีแก้
