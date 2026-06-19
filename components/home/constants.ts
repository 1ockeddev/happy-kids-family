import { MilkStatus } from '@/types';

// Amount labels
export const amountLabels: Record<MilkStatus, string> = {
  all: 'ทานหมด',
  some: 'บางส่วน',
  not_must: 'นิดหน่อย',
  skip: 'ข้าม'
};

// Amount styles
export const amountStyles: Record<MilkStatus, { bg: string; color: string }> = {
  all: { bg: '#dcfce7', color: '#15803d' },
  some: { bg: '#fef3c7', color: '#b45309' },
  not_must: { bg: '#dbeafe', color: '#1e40af' },
  skip: { bg: '#ffe4e6', color: '#9f1239' }
};

// Attendance labels
export const attendanceLabels: Record<string, string> = {
  present: 'มาเรียน',
  absent: 'ขาดเรียน',
  sick: 'ป่วย',
  leave: 'ลา'
};

// Attendance colors
export const attendanceColors: Record<string, string> = {
  present: '#10b981',
  absent: '#ef4444',
  sick: '#f59e0b',
  leave: '#3b82f6'
};

// Attendance backgrounds
export const attendanceBackgrounds: Record<string, string> = {
  present: '#ecfdf5',
  absent: '#fef2f2',
  sick: '#fffbeb',
  leave: '#eff6ff'
};

// Shimmer animation style
export const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 8
};
