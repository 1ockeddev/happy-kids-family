# การปรับปรุง /admin/daily - เพิ่มฟีเจอร์ Report พร้อม UI ใหม่

## สรุปการเปลี่ยนแปลง

ปรับปรุง flow ของหน้า `/admin/daily` ให้สามารถเพิ่ม Daily Report ได้ 2 วิธี และ**ใช้ UI เดียวกันกับ `/admin/reports`**:
1. **ในตัว modal "เพิ่มบันทึกรายวัน"** - สามารถเพิ่ม report ให้นักเรียน 1 คนได้เลยพร้อมกับการสร้าง daily record
2. **จากปุ่มในตาราง** - เพิ่ม report ให้ daily record ที่มีอยู่แล้ว

## ฟีเจอร์ใหม่

### 1. UI ใหม่เหมือน /admin/reports ⭐ NEW
- สร้าง **ReportModalContent component** ที่ใช้ร่วมกันได้
- ใช้ button pills แทน dropdown สำหรับเลือกนักเรียน
- ใช้ button pills สำหรับเลือกครูผู้บันทึก (พร้อมรูปโปรไฟล์)
- แสดง Daily Info เป็น cards สีสันสวยงาม
- จัดกลุ่มข้อมูลด้วยสีพื้นหลังที่แตกต่างกัน:
  - 🧠 พฤติกรรม: สีเทาอ่อน (#FAFAFA)
  - 😴 การนอน: สีเทา (#F7F5F2)
  - 🚽 ขับถ่าย: สีม่วงอ่อน (#F0EEFF)
  - 🍱 อาหาร: สีเขียวอ่อน (#EBF7F0)
  - 🍼 นม: สีส้มอ่อน (#FEF0EB)
  - 👩‍🏫 ครู: สีเทา (#F7F5F2)

### 2. แสดงจำนวน Reports ในตาราง
- เพิ่มคอลัมน์ "Reports" ที่แสดงจำนวน reports ที่มีอยู่แล้วในแต่ละ daily record
- ใช้ badge สีเขียว (active) เมื่อมี reports, สีเทา (inactive) เมื่อยังไม่มี
- แสดงไอคอน FileText พร้อมจำนวน

### 3. ปุ่ม "เพิ่ม Report" ในแต่ละแถว
- เพิ่มปุ่ม "เพิ่ม Report" สีน้ำเงิน (primary) ในแต่ละแถวของ daily record
- คลิกแล้วจะเปิด modal สำหรับเพิ่ม report ของนักเรียน 1 คน

### 4. ส่วน Report ใน Modal "เพิ่มบันทึกรายวัน"
- เมื่อเลือกห้องเรียนแล้ว จะมีปุ่ม **"เพิ่ม Report สำหรับนักเรียน 1 คน"**
- คลิกแล้วจะแสดงฟอร์ม report แบบเต็มภายใน modal เดียวกัน
- Modal จะขยายเป็น size large อัตโนมัติเมื่อแสดงส่วน report
- สามารถซ่อนส่วน report ได้โดยคลิกปุ่มอีกครั้ง

## ไฟล์ที่แก้ไข

### 1. `/components/admin/ReportModalContent.tsx` ⭐ NEW
สร้าง reusable component สำหรับ Report Modal UI:
- รับ props: selectedDaily, childrenForCohort, behaviorsForCohort, teachers, reportForm, scores, excretions
- รับ callbacks: onReportFormChange, onScoreChange, onScoreNoteChange, onExcretionAdd, onExcretionUpdate, onExcretionDelete, onChildSelect
- ใช้ UI แบบเดียวกับ `/admin/reports`:
  - Button pills สำหรับเลือกนักเรียน
  - Button pills สำหรับเลือกครู (พร้อมรูปโปรไฟล์)
  - Cards แสดง Daily Info
  - Section headers พร้อม emoji และสี
  - Behavior sorting (Conduct และ Work Habits ขึ้นก่อน)

### 2. `/app/admin/daily/page.tsx`
- เพิ่ม import: `ReportModalContent`
- ลบ components ภายใน: `AmountSelect`, `ScoreInput` (ย้ายไปใน ReportModalContent)
- แก้ไข modal add-report: ใช้ `<ReportModalContent />` แทนโค้ดเดิม
- เพิ่ม `onChildSelect` callback สำหรับตั้งค่า default scores

### 3. `/components/ui/Modal.tsx`
- เพิ่ม prop `size?: 'default' | 'large'`
- ปรับ style ของ modal ให้รองรับ size large (maxWidth: 900px, width: 90%)

## ประโยชน์

1. **UI สวยงามและสอดคล้องกัน**: ใช้ UI เดียวกันกับ `/admin/reports`
2. **Code reusability**: สร้าง component ที่ใช้ร่วมกันได้
3. **ลดขั้นตอนการทำงาน**: สร้าง daily + report ได้ในคลิกเดียว
4. **UX ดีขึ้น**: ใช้ button pills แทน dropdown ทำให้เลือกได้เร็วขึ้น
5. **Visual hierarchy**: ใช้สีแยกแต่ละส่วนทำให้อ่านง่าย
6. **Maintainability**: แก้ไข UI ที่เดียวได้ผลทั้ง 2 หน้า

## การใช้งาน

### วิธีที่ 1: เพิ่ม Daily + Report พร้อมกัน (ใน Modal เดียว)
1. ไปที่หน้า `/admin/daily`
2. คลิกปุ่ม "เพิ่มบันทึก"
3. กรอกข้อมูล daily (ห้องเรียน, วันที่, กิจกรรม, อาหาร, ผลไม้)
4. คลิกปุ่ม **"เพิ่ม Report สำหรับนักเรียน 1 คน"**
5. คลิกเลือกนักเรียนจาก button pills
6. กรอกข้อมูล report
7. คลิก "บันทึก"

### วิธีที่ 2: เพิ่ม Report ให้ Daily ที่มีอยู่
1. ไปที่หน้า `/admin/daily`
2. เลือก daily record ที่ต้องการเพิ่ม report
3. คลิกปุ่ม "เพิ่ม Report"
4. คลิกเลือกนักเรียนจาก button pills
5. กรอกข้อมูล report
6. คลิก "บันทึก"

## UI Components

### Button Pills
- นักเรียน: สีม่วง (#6C5CE7) เมื่อเลือก
- ครู: สีดำ (#1A1A2E) เมื่อเลือก พร้อมรูปโปรไฟล์

### Section Colors
- พฤติกรรม: #FAFAFA (เทาอ่อน)
- การนอน: #F7F5F2 (เทา)
- ขับถ่าย: #F0EEFF (ม่วงอ่อน)
- อาหาร: #EBF7F0 (เขียวอ่อน)
- นม: #FEF0EB (ส้มอ่อน)

## หมายเหตุ

- ฟีเจอร์นี้ไม่ได้แทนที่หน้า `/admin/reports` แต่เป็นการเพิ่มทางเลือกในการเพิ่ม report
- UI ใหม่ทำให้การเลือกนักเรียนและครูเร็วขึ้น (คลิกแทนการเลื่อน dropdown)
- Component `ReportModalContent` สามารถนำไปใช้ในหน้าอื่นได้
- ในอนาคตอาจพิจารณาย้าย reports ทั้งหมดมาอยู่ภายใน daily records เพื่อจัดระเบียบให้ดีขึ้น

## ฟีเจอร์ใหม่

### 1. แสดงจำนวน Reports ในตาราง
- เพิ่มคอลัมน์ "Reports" ที่แสดงจำนวน reports ที่มีอยู่แล้วในแต่ละ daily record
- ใช้ badge สีเขียว (active) เมื่อมี reports, สีเทา (inactive) เมื่อยังไม่มี
- แสดงไอคอน FileText พร้อมจำนวน

### 2. ปุ่ม "เพิ่ม Report" ในแต่ละแถว
- เพิ่มปุ่ม "เพิ่ม Report" สีน้ำเงิน (primary) ในแต่ละแถวของ daily record
- คลิกแล้วจะเปิด modal สำหรับเพิ่ม report ของนักเรียน 1 คน

### 3. ส่วน Report ใน Modal "เพิ่มบันทึกรายวัน" ⭐ NEW
- เมื่อเลือกห้องเรียนแล้ว จะมีปุ่ม **"เพิ่ม Report สำหรับนักเรียน 1 คน"**
- คลิกแล้วจะแสดงฟอร์ม report แบบเต็มภายใน modal เดียวกัน
- Modal จะขยายเป็น size large อัตโนมัติเมื่อแสดงส่วน report
- สามารถซ่อนส่วน report ได้โดยคลิกปุ่มอีกครั้ง

### 4. Modal เพิ่ม Report แบบครบถ้วน
Modal มีฟอร์มครบถ้วนเหมือนกับหน้า `/admin/reports`:

#### ข้อมูลพื้นฐาน
- เลือกนักเรียน (จากนักเรียนในห้องเรียนนั้น)
- เลือกครูผู้บันทึก (default: ครูเบียร์)
- แสดงข้อมูล daily (กิจกรรม, อาหาร, ผลไม้)

#### ข้อมูลการดูแล
- **💤 เวลานอน**: เวลาเริ่ม - เวลาสิ้นสุด
- **🥛 นม #1 และ #2**: เลือกปริมาณ (หมด/บางส่วน/ไม่จำเป็น/ข้าม) + หมายเหตุ
- **🍱 อาหาร**: เลือกปริมาณ + หมายเหตุ
- **🍎 ผลไม้**: เลือกปริมาณ + หมายเหตุ

#### ข้อมูลขับถ่าย
- **🚽 ขับถ่าย**: เพิ่มได้หลายรายการ
  - เวลา
  - ประเภท (ปัสสาวะ/อุจจาระ)
  - วิธีการ (ผ้าอ้อม/กระโถน)
  - ปุ่มลบแต่ละรายการ

#### พฤติกรรม
- **📊 พฤติกรรม**: แสดงตามหมวดหมู่ที่กำหนดไว้สำหรับห้องเรียนนั้น
  - ใช้ Face Icons (😐 ควรส่งเสริม / 🙂 ทำได้ดี / 😄 ดีเยี่ยม)
  - สามารถเพิ่มหมายเหตุแต่ละพฤติกรรมได้
  - Default score = 3 (ดีเยี่ยม) สำหรับทุกพฤติกรรม

#### หมายเหตุ
- **💬 หมายเหตุจากครู**: textarea สำหรับข้อความเพิ่มเติม

## การทำงาน

### Flow 1: เพิ่ม Daily + Report พร้อมกัน (ใน Modal เดียว)
1. ผู้ใช้คลิกปุ่ม "เพิ่มบันทึก"
2. กรอกข้อมูล daily (ห้องเรียน, วันที่, กิจกรรม, อาหาร, ผลไม้)
3. คลิกปุ่ม **"เพิ่ม Report สำหรับนักเรียน 1 คน"**
4. ระบบโหลดข้อมูล:
   - นักเรียนในห้องเรียนนั้น
   - พฤติกรรมที่กำหนดไว้
   - ครูทั้งหมด
5. เลือกนักเรียนและกรอกข้อมูล report
6. คลิก "บันทึก"
7. ระบบบันทึก:
   - Daily record ก่อน (ได้ daily_id)
   - Daily report (ใช้ daily_id ที่ได้)
   - Excretions
   - Behavior scores
8. รีเฟรชตารางและแสดงจำนวน reports = 1

### Flow 2: เพิ่ม Report ให้ Daily ที่มีอยู่แล้ว
1. ผู้ใช้คลิกปุ่ม "เพิ่ม Report" ในแถวของ daily record
2. เปิด modal แยกสำหรับเพิ่ม report
3. เลือกนักเรียนและกรอกข้อมูล
4. บันทึก report
5. รีเฟรชและอัปเดตจำนวน reports

### การโหลดจำนวน Reports
- เมื่อโหลดข้อมูล daily records จะโหลดจำนวน reports ของแต่ละ record พร้อมกัน
- ใช้ `Promise.all` เพื่อโหลดแบบ parallel
- เก็บไว้ใน state `reportCounts` (Record<string, number>)

### การโหลดนักเรียนและพฤติกรรม
- เมื่อเลือกห้องเรียนใน modal add/edit จะโหลดนักเรียนและพฤติกรรมอัตโนมัติ
- ใช้ `useEffect` ที่ watch `form.cohort_id`
- เมื่อเลือกนักเรียน จะตั้งค่า default scores ให้ทุกพฤติกรรม = 3

## ไฟล์ที่แก้ไข

### 1. `/app/admin/daily/page.tsx`
- เพิ่ม state: `showReportInModal` (boolean) - ควบคุมการแสดง/ซ่อนส่วน report ใน modal
- เพิ่ม `useEffect` สำหรับโหลดนักเรียนและพฤติกรรมเมื่อเลือกห้องเรียน
- แก้ไข `handleSave()`: 
  - บันทึก daily record ก่อน (ได้ daily_id)
  - ถ้ามีส่วน report และเลือกนักเรียนแล้ว จะบันทึก report ด้วย
- แก้ไข modal add/edit:
  - เพิ่มปุ่ม toggle สำหรับแสดง/ซ่อนส่วน report
  - เพิ่มฟอร์ม report แบบเต็มภายใน modal
  - ปรับ size เป็น large เมื่อแสดงส่วน report
- แก้ไข `onAdd`: reset report form และ scores
- แก้ไข `onClose`: reset `showReportInModal`

### 2. `/components/ui/Modal.tsx`
- เพิ่ม prop `size?: 'default' | 'large'`
- ปรับ style ของ modal ให้รองรับ size large (maxWidth: 900px, width: 90%)

## ประโยชน์

1. **ลดขั้นตอนการทำงาน**: สร้าง daily + report ได้ในคลิกเดียว
2. **เพิ่มความสะดวก**: ไม่ต้องสร้าง daily ก่อนแล้วค่อยกลับมาเพิ่ม report
3. **ยืดหยุ่น**: มี 2 วิธีในการเพิ่ม report (ใน modal หรือจากตาราง)
4. **เห็นภาพรวม**: เห็นจำนวน reports ของแต่ละวันในตาราง
5. **เตรียมพร้อมสำหรับอนาคต**: พร้อมสำหรับการย้าย `/admin/reports` มาอยู่ภายใน daily records

## การใช้งาน

### วิธีที่ 1: เพิ่ม Daily + Report พร้อมกัน
1. ไปที่หน้า `/admin/daily`
2. คลิกปุ่ม "เพิ่มบันทึก"
3. กรอกข้อมูล daily (ห้องเรียน, วันที่, กิจกรรม, อาหาร, ผลไม้)
4. คลิกปุ่ม **"เพิ่ม Report สำหรับนักเรียน 1 คน"**
5. เลือกนักเรียนและกรอกข้อมูล report
6. คลิก "บันทึก"

### วิธีที่ 2: เพิ่ม Report ให้ Daily ที่มีอยู่
1. ไปที่หน้า `/admin/daily`
2. เลือก daily record ที่ต้องการเพิ่ม report
3. คลิกปุ่ม "เพิ่ม Report"
4. เลือกนักเรียนและกรอกข้อมูล
5. คลิก "บันทึก"

## หมายเหตุ

- ฟีเจอร์นี้ไม่ได้แทนที่หน้า `/admin/reports` แต่เป็นการเพิ่มทางเลือกในการเพิ่ม report
- ส่วน report จะแสดงเฉพาะเมื่อเลือกห้องเรียนแล้ว
- Modal จะขยายเป็น size large อัตโนมัติเมื่อแสดงส่วน report
- สามารถซ่อนส่วน report ได้โดยคลิกปุ่ม toggle อีกครั้ง
- ในอนาคตอาจพิจารณาย้าย reports ทั้งหมดมาอยู่ภายใน daily records เพื่อจัดระเบียบให้ดีขึ้น
