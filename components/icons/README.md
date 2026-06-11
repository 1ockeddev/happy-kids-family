# Icon Components Library

> SVG icon components สำหรับ Happy Kids with Kru Beer System

## 📦 Available Icons

### Emotion/Behavior Icons
ใช้สำหรับแสดงอารมณ์และพฤติกรรมของเด็ก

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| 😊 | `FaceHappy` | 22px | `#10b981` (green) | ดีมาก (≥80%) |
| 🙂 | `FaceSmile` | 22px | `#facc15` (yellow) | ดี (60-79%) |
| 😐 | `FaceNeutral` | 22px | `#f97316` (orange) | ควรปรับปรุง (<60%) |

### Status Icons
ใช้สำหรับแสดงสถานะต่างๆ (attendance, success, error)

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| ✓ | `CheckCircle` | 20px | `currentColor` | Present/Success/มาเรียน |
| ✗ | `XCircle` | 20px | `currentColor` | Absent/Error/ขาดเรียน |
| ! | `AlertCircle` | 20px | `currentColor` | Warning/Sick/ป่วย |

### Amount Icons
ใช้สำหรับแสดงปริมาณอาหาร/นม

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| ● | `CircleFull` | 18px | `currentColor` | ทานหมด (all) |
| ◐ | `CircleHalf` | 18px | `currentColor` | บางส่วน (some) |
| ◔ | `CircleQuarter` | 18px | `currentColor` | นิดหน่อย (little) |
| ○ | `CircleEmpty` | 18px | `currentColor` | ข้าม (skip) |

### Activity Icons
ใช้สำหรับแสดงกิจกรรมต่างๆ

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| 📚 | `Book` | 16px | `#6366f1` | กิจกรรมเรียน/Learning |
| 🛏️ | `Bed` | 28px | `currentColor` | นอน/Sleep |
| 📷 | `Camera` | 20px | `currentColor` | ถ่ายรูป/Photo |
| ✏️ | `PencilSquare` | 20px | `currentColor` | แก้ไข/Edit/Note |

### Date/Calendar Icons
ใช้สำหรับแสดงวันที่และปฏิทิน

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| 📅 | `Calendar` | 16px | `#94a3b8` | วันที่/Date/ลา |

### Excretion Icons
ใช้สำหรับแสดงการขับถ่าย

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| 🩲 | `Diaper` | 24px | `currentColor` | ผ้าอ้อม |
| 🚽 | `Toilet` | 24px | `currentColor` | กระโถน/Potty |

### UI Icons
ใช้สำหรับ UI elements

| Icon | Component | Default Size | Default Color | Usage |
|------|-----------|--------------|---------------|-------|
| 🏫 | `Building` | 48px | `#6366f1` | โรงเรียน/School |
| 👤 | `User` | 20px | `currentColor` | ครู/Teacher/User |

## 🚀 Usage

### Basic Import
```tsx
import { FaceHappy, CheckCircle, Book } from '@/components/icons';
```

### Using with Default Props
```tsx
<FaceHappy />                   // size=22, color='#10b981'
<CheckCircle />                 // size=20, color='currentColor'
<Book />                        // size=16, color='#6366f1'
```

### Custom Size and Color
```tsx
<FaceHappy size={32} color="#22c55e" />
<CheckCircle size={24} color="#10b981" />
<Book size={20} color="#8b5cf6" />
```

### Using with CSS Variables (Recommended)
```tsx
<FaceHappy 
  size={24} 
  color="var(--behavior-excellent)" 
/>

<CheckCircle 
  size={20} 
  color="var(--attendance-present)" 
/>

<CircleFull 
  size={18} 
  color="var(--amount-all)" 
/>
```

### With className
```tsx
<FaceHappy 
  size={24} 
  color="#10b981"
  className="my-custom-class"
/>
```

### Custom Stroke Width (for stroke-based icons)
```tsx
<CheckCircle 
  size={24} 
  color="#10b981" 
  strokeWidth={2.5}  // default is 2
/>
```

## 🎨 Design Tokens

### Semantic Colors
ใช้ CSS variables สำหรับความสอดคล้องในการใช้สี

```css
/* Behavior Status Colors */
--behavior-excellent: #10b981;              /* Happy (≥80%) */
--behavior-good: #facc15;                   /* Smile (60-79%) */
--behavior-needs-improvement: #f97316;      /* Neutral (<60%) */

/* Attendance Status Colors */
--attendance-present: #10b981;              /* มาเรียน */
--attendance-absent: #ef4444;               /* ขาดเรียน */
--attendance-sick: #f59e0b;                 /* ป่วย */
--attendance-leave: #3b82f6;                /* ลา */

/* Amount Status Colors */
--amount-all: #10b981;                      /* ทานหมด */
--amount-some: #facc15;                     /* บางส่วน */
--amount-little: #f97316;                   /* นิดหน่อย */
--amount-skip: #94a3b8;                     /* ข้าม */

/* Activity Type Colors */
--activity-learning: #6366f1;               /* กิจกรรมเรียน */
--activity-sleep: #8b5cf6;                  /* นอน */
--activity-play: #ec4899;                   /* เล่น */
```

### Icon Sizes
```css
--icon-xs: 14px;
--icon-sm: 16px;
--icon-md: 20px;   /* default */
--icon-lg: 24px;
--icon-xl: 32px;
--icon-2xl: 40px;
```

## 📋 Props Interface

```tsx
interface IconProps {
  size?: number;           // Icon size in pixels
  color?: string;          // Icon color (hex, rgb, or CSS variable)
  className?: string;      // Additional CSS class
  strokeWidth?: number;    // Stroke width (for stroke-based icons only)
}
```

## 💡 Best Practices

### 1. Use Semantic Colors
```tsx
// ✅ Good - using CSS variables
<FaceHappy color="var(--behavior-excellent)" />

// ❌ Avoid - hard-coded colors
<FaceHappy color="#10b981" />
```

### 2. Consistent Sizing
```tsx
// Use icon size tokens for consistency
<CheckCircle size={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--icon-md'))} />

// Or use standard sizes
<CheckCircle size={20} />  // --icon-md
<Book size={16} />         // --icon-sm
```

### 3. Accessibility
```tsx
// Icons have built-in aria-label
<FaceHappy />  // aria-label="ดีมาก"

// For decorative icons, hide from screen readers
<FaceHappy aria-hidden="true" />

// Add text for screen readers
<button>
  <CheckCircle aria-hidden="true" />
  <span className="sr-only">มาเรียน</span>
</button>
```

### 4. Touch Targets (Mobile)
```tsx
// Ensure minimum 44x44px touch target
<button style={{minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
  <CheckCircle size={20} />
</button>
```

## 🎯 Common Patterns

### Behavior Score Display
```tsx
const percent = (score / maxScore) * 100;
const icon = percent >= 80 ? <FaceHappy /> :
             percent >= 60 ? <FaceSmile /> :
             <FaceNeutral />;
```

### Attendance Status Badge
```tsx
const getAttendanceIcon = (status: string) => {
  switch(status) {
    case 'present': return <CheckCircle color="var(--attendance-present)" />;
    case 'absent': return <XCircle color="var(--attendance-absent)" />;
    case 'sick': return <AlertCircle color="var(--attendance-sick)" />;
    case 'leave': return <Calendar color="var(--attendance-leave)" />;
    default: return null;
  }
};
```

### Food Amount Display
```tsx
const getAmountIcon = (amount: string) => {
  switch(amount) {
    case 'all': return <CircleFull color="var(--amount-all)" />;
    case 'some': return <CircleHalf color="var(--amount-some)" />;
    case 'not_much': return <CircleQuarter color="var(--amount-little)" />;
    case 'skip': return <CircleEmpty color="var(--amount-skip)" />;
    default: return null;
  }
};
```

## 🔧 Technical Details

### SVG Specifications
- **ViewBox**: Most icons use `0 0 24 24` (standardized)
- **Face icons**: Use `0 0 100 100` for better detail
- **Stroke Width**: Default 2px (can be customized)
- **Stroke Cap**: `round` for smooth corners
- **Stroke Join**: `round` for smooth joins

### Performance
- Tree-shaking: Only imported icons are bundled
- No external dependencies
- Inline SVG for optimal performance
- Small file size per icon (~1-2KB)

### Browser Support
- All modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari (LINE In-App Browser)
- Android Chrome
- No IE11 support needed

## 📚 Examples

### Complete Behavior Card
```tsx
<div className="behavior-card">
  <FaceHappy size={24} color="var(--behavior-excellent)" />
  <div>
    <span>มารยาท</span>
    <span>5/5</span>
  </div>
</div>
```

### Attendance Legend
```tsx
<div style={{display:'flex', gap:8}}>
  <div style={{display:'flex', alignItems:'center', gap:4}}>
    <CheckCircle size={12} color="var(--attendance-present)" />
    <span>มา</span>
  </div>
  <div style={{display:'flex', alignItems:'center', gap:4}}>
    <XCircle size={12} color="var(--attendance-absent)" />
    <span>ขาด</span>
  </div>
  <div style={{display:'flex', alignItems:'center', gap:4}}>
    <AlertCircle size={12} color="var(--attendance-sick)" />
    <span>ป่วย</span>
  </div>
</div>
```

### Activity with Icon
```tsx
<div style={{display:'flex', alignItems:'center', gap:6}}>
  <Book size={14} color="#6366f1" />
  <span>กิจกรรม: วาดรูป</span>
</div>
```

## 🐛 Troubleshooting

### Icon Not Showing
```tsx
// ✅ Correct import
import { FaceHappy } from '@/components/icons';

// ❌ Wrong - don't import from specific file
import { FaceHappy } from '@/components/icons/FaceHappy';
```

### Color Not Working
```tsx
// ✅ Use valid CSS color
<CheckCircle color="#10b981" />
<CheckCircle color="rgb(16, 185, 129)" />
<CheckCircle color="var(--attendance-present)" />

// ❌ Don't use invalid values
<CheckCircle color="green-500" />  // Wrong
```

### Size Issues
```tsx
// ✅ Use number (pixels)
<CheckCircle size={20} />

// ❌ Don't use string
<CheckCircle size="20px" />  // Wrong
```

## 📝 Contributing

เมื่อเพิ่ม icon ใหม่:
1. สร้างไฟล์ใน `components/icons/YourIcon.tsx`
2. ใช้ `IconProps` interface
3. เพิ่ม export ใน `index.tsx`
4. อัพเดต README นี้
5. ทดสอบใน dark/light mode
6. ตรวจสอบ accessibility (aria-label)

---

**Created**: 2026-06-10  
**Total Icons**: 20 components  
**Maintained by**: Happy Kids Development Team
