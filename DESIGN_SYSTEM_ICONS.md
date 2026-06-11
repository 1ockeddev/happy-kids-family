# 🎨 Design System: Icons & Colors

> Spec สำหรับสร้างระบบ Icon และสีที่เป็นมาตรฐานเดียวกันทั้งแอป

## 📍 สถานะปัจจุบัน

### ✅ Icons ที่มีอยู่แล้ว
| Icon | Location | Usage |
|------|----------|-------|
| `FaceHappy` 😊 | `app/page.tsx` | Behavior excellent (≥80%) |
| `FaceSmile` 🙂 | `app/page.tsx` | Behavior good (60-79%) |
| `FaceNeutral` 😐 | `app/page.tsx` | Behavior needs improvement (<60%) |
| `CalendarIcon` 📅 | `components/AppHeader.tsx` | Date display |
| `BookIcon` 📚 | `app/page.tsx` | Activity indicator |

### ❌ สิ่งที่ยังขาด
- Food/Milk status icons (all, some, little, skip)
- Attendance status icons (present, absent, sick, leave)
- Activity icons (bed/sleep, camera/photo)
- Excretion icons (diaper, toilet)
- UI icons (edit, user, building)

### ⚠️ ปัญหาปัจจุบัน
- Icons ถูกสร้างซ้ำหลายที่ (duplication)
- ใช้ emoji ในหลายจุด (🛏️, 📷, 💩, 💧)
- ไม่มี centralized icon library
- Colors hard-coded แทนที่จะใช้ CSS variables

## 🎯 เป้าหมาย

### Design System Architecture
```
components/icons/
  ├── index.tsx           # Export all icons
  │
  ├── Emotion/Behavior
  ├── FaceHappy.tsx      # ดีมาก (green)
  ├── FaceSmile.tsx      # ดี (yellow)
  ├── FaceNeutral.tsx    # ควรปรับปรุง (orange)
  │
  ├── Status
  ├── CheckCircle.tsx    # Present/Success ✓
  ├── XCircle.tsx        # Absent/Error ✗
  ├── AlertCircle.tsx    # Warning/Sick !
  ├── Calendar.tsx       # Date/Leave
  │
  ├── Amount
  ├── CircleFull.tsx     # All ●
  ├── CircleHalf.tsx     # Some ◐
  ├── CircleQuarter.tsx  # Little ◔
  ├── CircleEmpty.tsx    # Skip ○
  │
  ├── Activity
  ├── Book.tsx           # Learning
  ├── Bed.tsx            # Sleep
  ├── Camera.tsx         # Photo
  │
  ├── Excretion
  ├── Diaper.tsx         # Diaper change
  ├── Toilet.tsx         # Potty
  │
  └── UI
      ├── PencilSquare.tsx  # Edit
      ├── User.tsx          # Teacher
      └── Building.tsx      # School
```

### Design Tokens (CSS Variables)
```css
/* Behavior Colors */
--behavior-excellent: #10b981;              /* Happy (≥80%) */
--behavior-good: #facc15;                   /* Smile (60-79%) */
--behavior-needs-improvement: #f97316;      /* Neutral (<60%) */

/* Attendance Colors */
--attendance-present: #10b981;              /* มาเรียน */
--attendance-absent: #ef4444;               /* ขาดเรียน */
--attendance-sick: #f59e0b;                 /* ป่วย */
--attendance-leave: #3b82f6;                /* ลา */

/* Amount Colors */
--amount-all: #10b981;                      /* ทานหมด */
--amount-some: #facc15;                     /* บางส่วน */
--amount-little: #f97316;                   /* นิดหน่อย */
--amount-skip: #94a3b8;                     /* ข้าม */

/* Icon Sizes */
--icon-xs: 14px;
--icon-sm: 16px;
--icon-md: 20px;  /* default */
--icon-lg: 24px;
--icon-xl: 32px;
--icon-2xl: 40px;
```

## 📋 Implementation Plan

### Phase 1: Icon Library (7 tasks)
1. Setup directory structure
2. Migrate existing icons
3. Create status icons
4. Create amount icons
5. Create activity icons
6. Create excretion icons
7. Update design tokens in globals.css

### Phase 2: Replace Inline (3 tasks)
1. Update `app/page.tsx`
2. Update `app/summary-behavior/page.tsx`
3. Update `components/AppHeader.tsx`

### Phase 3: Replace Emoji (4 tasks)
1. Food & Milk sections → Amount icons
2. Nap section → Bed icon
3. Excretion section → Diaper/Toilet icons
4. Photo section → Camera icon

### Phase 4: New Features (3 tasks)
1. Add icons to attendance badges
2. Update contribution graph tooltip
3. Add teacher/school icons

### Phase 5: Testing & Docs (4 tasks)
1. Accessibility testing
2. Visual testing (iOS, Android, Desktop)
3. Performance testing
4. Create documentation

## 🎨 Icon Component Template

```tsx
// components/icons/ExampleIcon.tsx
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const ExampleIcon = ({
  size = 20,
  color = 'currentColor',
  className = '',
  strokeWidth = 2
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="Example"
  >
    {/* SVG paths here */}
  </svg>
);
```

## 📊 Usage Examples

### Before & After

#### Behavior Display
```tsx
// Before
<span style={{fontSize: '1.2rem'}}>😊</span>

// After
<FaceHappy size={24} color="var(--behavior-excellent)" />
```

#### Food Status
```tsx
// Before
<span className="status-pill status-all">ทานหมด</span>

// After
<div className="food-status">
  <CircleFull size={18} color="var(--amount-all)" />
  <span>ทานหมด</span>
</div>
```

#### Attendance Badge
```tsx
// Before
<span className="badge-present">มาเรียน</span>

// After
<div className="badge badge-present">
  <CheckCircle size={16} color="var(--attendance-present)" />
  <span>มาเรียน</span>
</div>
```

#### Tooltip
```tsx
// Before
text="📅 1 ม.ค. 2567\n📚 กิจกรรม: วาดรูป"

// After
<div className="tooltip-content">
  <div><Calendar size={14} /> 1 ม.ค. 2567</div>
  <div><Book size={14} /> กิจกรรม: วาดรูป</div>
</div>
```

## ✅ Success Criteria
- [ ] ทุก emoji ถูกแทนที่ด้วย SVG icons
- [ ] มี centralized icon library
- [ ] มี design tokens ครบถ้วน
- [ ] Icons รองรับ size และ color props
- [ ] แสดงผลสม่ำเสมอทุก platform
- [ ] ผ่าน WCAG AA accessibility
- [ ] Build ผ่านไม่มี error

## 🔗 Related Documentation
- **Full Spec**: `.kiro/specs/design-system-icons/`
  - `README.md` - Overview
  - `spec.md` - Goals, scope, risks
  - `design.md` - Design specifications
  - `tasks.md` - 24 implementation tasks

## 📝 Notes
- เก็บสี Face icon เดิมไว้: Happy=#10b981, Smile=#facc15, Neutral=#f97316
- Default icon size = 20px (mobile-friendly)
- Stroke width = 2px (clear on small screens)
- ใช้ currentColor เพื่อรับสีจาก parent
- ViewBox: 0 0 24 24 (standardized)

## ⏱️ Timeline
- **Phase 1**: 2-3 hours
- **Phase 2**: 1-2 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 1-2 hours
- **Phase 5**: 1 hour
- **Total**: 7-11 hours

---

**Created**: 2026-06-10  
**Status**: Design Complete - Ready for Implementation  
**Total Tasks**: 24 tasks across 5 phases
