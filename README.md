# Happy Kids Family 🌻

โปรเจกต์ระบบจัดการศูนย์พัฒนาเด็กเล็ก สร้างด้วย [Next.js](https://nextjs.org) และ PostgreSQL

## ภาพรวม

ระบบครบวงจรสำหรับจัดการศูนย์เลี้ยงเด็ก ประกอบด้วย:

- 📊 **Admin Dashboard** - จัดการข้อมูลนักเรียน ห้องเรียน บันทึกรายวัน
- 📱 **LINE LIFF App** - แอพสำหรับผู้ปกครอง ดูรายงานประจำวัน
- 🤖 **LINE Official Account** - Webhook และ Flex Messages
- 📈 **Analytics** - วิเคราะห์พฤติกรรม อาหาร การนอน
- 📋 **Daily Reports** - รายงานสุขภาพ พฤติกรรม กิจกรรม

## ✨ Features ใหม่

### LINE Groups Management (June 2026) ⭐ NEW
ระบบจัดการ LINE กลุ่ม:
- ✅ รองรับ group chat
- ✅ ติดตามสมาชิกในกลุ่ม
- ✅ เก็บ log events และข้อความ
- ✅ Admin UI จัดการกลุ่ม
- ✅ Analytics และ statistics

**เอกสาร:** [`LINE_GROUPS_GUIDE.md`](./LINE_GROUPS_GUIDE.md)

### LINE Flex Messages Management (June 2026)
ระบบจัดการ Flex Messages ใหม่:
- ✅ สร้างและจัดการ templates
- ✅ ส่ง flex messages ทดสอบ
- ✅ Webhook รองรับ follow/unfollow/message events
- ✅ Auto-reply "activity" keyword

**เอกสาร:** [`LINE_MESSAGES_GUIDE.md`](./LINE_MESSAGES_GUIDE.md)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- LINE Developers Account (สำหรับ LINE features)

### Installation

1. **Clone และติดตั้ง dependencies:**

```bash
npm install
```

2. **ตั้งค่า Environment Variables:**

Copy `.env.local.example` to `.env.local` และกรอกค่า:

```bash
cp .env.local.example .env.local
```

ตัวแปรสำคัญ:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/school_attendance

# Admin
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password

# LINE
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx
NEXT_PUBLIC_LIFF_ID=xxx

# Google Drive (optional)
GDRIVE_ACTIVITY_FOLDER_ID=xxx
GDRIVE_API_KEY=xxx
```

3. **รัน Database Migrations:**

```bash
# สร้าง database
createdb school_attendance

# รัน migrations
export DATABASE_URL="postgresql://postgres:0000@localhost:5432/school_attendance"
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_add_admin_roles.sql
psql "$DATABASE_URL" -f db/migrations/003_add_line_flex_templates.sql
psql "$DATABASE_URL" -f db/migrations/004_add_line_groups.sql
```

4. **เริ่ม Development Server:**

```bash
npm run dev
```

5. **เข้าใช้งาน:**

- **Admin:** http://localhost:3000/admin (ใช้ ADMIN_USERNAME/PASSWORD)
- **LINE LIFF:** http://localhost:3000 (ต้องเปิดใน LINE app)
- **LINE Messages Admin:** http://localhost:3000/admin/line-messages
- **LINE Groups Admin:** http://localhost:3000/admin/line-groups ⭐ NEW

## 📚 Documentation

- [LINE Groups Guide](./LINE_GROUPS_GUIDE.md) - จัดการกลุ่ม LINE ⭐ NEW
- [LINE Messages Guide](./LINE_MESSAGES_GUIDE.md) - จัดการ Flex Messages
- [LINE Messages Testing](./LINE_MESSAGES_TESTING_CHECKLIST.md) - วิธีทดสอบ
- [Home Page Refactor](./HOME_PAGE_REFACTOR.md) - Component structure
- [Analytics System](./ANALYTICS_SYSTEM.md) - ระบบวิเคราะห์
- [Batch Import Guide](./BATCH_IMPORT_GUIDE.md) - นำเข้าข้อมูลจำนวนมาก

## 🏗️ Project Structure

```
├── app/
│   ├── (user)/              # LIFF app (ผู้ปกครอง)
│   ├── admin/               # Admin dashboard
│   │   ├── line-messages/   # LINE Flex Messages ✨ NEW
│   │   ├── children/        # จัดการนักเรียน
│   │   ├── daily/           # บันทึกรายวัน
│   │   └── ...
│   └── api/
│       ├── line/            # LINE API endpoints ✨ NEW
│       ├── webhook/line/    # LINE webhook
│       └── ...
├── components/
│   ├── admin/               # Admin components
│   └── home/                # Home page components
├── db/
│   └── migrations/          # Database migrations
├── lib/                     # Utilities
└── public/                  # Static assets
```

## 🔧 Tech Stack

- **Frontend:** Next.js 16.2.6 (App Router), React 19
- **Database:** PostgreSQL
- **Styling:** Custom CSS (no framework)
- **Icons:** lucide-react
- **LINE:** LIFF SDK, Messaging API
- **Storage:** Supabase (for avatars)

## 🚀 Deployment

### Database
```bash
# รัน migrations บน production
psql $DATABASE_URL -f db/migrations/001_initial_schema.sql
psql $DATABASE_URL -f db/migrations/002_add_admin_roles.sql
psql $DATABASE_URL -f db/migrations/003_add_line_flex_templates.sql
```

### LINE Webhook
ตั้งค่า Webhook URL ใน [LINE Developers Console](https://developers.line.biz/console/):
```
https://your-domain.com/api/webhook/line
```

### Environment Variables
ตรวจสอบว่า production server มี ENV variables ครบ

## 📱 LINE Official Account Features

### Webhook Events (อัตโนมัติ)
- **follow** - ต้อนรับผู้ใช้ใหม่ และบันทึกลง database
- **unfollow** - อัปเดตสถานะเป็น inactive
- **message "activity"** - ส่งตารางกิจกรรมจาก Google Drive

### Flex Messages (Admin Console)
- สร้างและจัดการ templates
- ส่ง flex messages ทดสอบ
- ดูข้อมูล webhook configuration

---

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
