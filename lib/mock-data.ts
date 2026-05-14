import { AppUser, Child, Cohort, Enrollment, Daily, Attendance, DailyReport, BehaviorCategory, BehaviorItem } from '@/types';

export const mockChildren: Child[] = [
  { id: '1', name_en: 'Emma Johnson', name_th: 'เอมมา จอห์นสัน', deleted_at: null, created_at: '2024-05-01' },
  { id: '2', name_en: 'Liam Smith', name_th: 'เลียม สมิธ', deleted_at: null, created_at: '2024-05-01' },
  { id: '3', name_en: 'Olivia Brown', name_th: 'โอลิเวีย บราวน์', deleted_at: null, created_at: '2024-05-01' },
  { id: '4', name_en: 'Noah Davis', name_th: 'โนอาห์ เดวิส', deleted_at: null, created_at: '2024-05-01' },
  { id: '5', name_en: 'Ava Wilson', name_th: 'อาวา วิลสัน', deleted_at: null, created_at: '2024-05-02' },
  { id: '6', name_en: 'Elijah Moore', name_th: 'อีไลจา มัวร์', deleted_at: null, created_at: '2024-05-02' },
];

export const mockCohorts: Cohort[] = [
  { id: '1', name: 'Sunflower Class', level: 'K1', academic_year: 2024, start_date: '2024-05-16', end_date: '2025-03-31', created_at: '2024-04-01' },
  { id: '2', name: 'Rainbow Class', level: 'K2', academic_year: 2024, start_date: '2024-05-16', end_date: '2025-03-31', created_at: '2024-04-01' },
  { id: '3', name: 'Butterfly Class', level: 'K3', academic_year: 2024, start_date: '2024-05-16', end_date: '2025-03-31', created_at: '2024-04-01' },
];

export const mockEnrollments: Enrollment[] = [
  { id: '1', child_id: '1', cohort_id: '1', start_date: '2024-05-16', end_date: null, graduated: false, created_at: '2024-05-01', child: mockChildren[0], cohort: mockCohorts[0] },
  { id: '2', child_id: '2', cohort_id: '1', start_date: '2024-05-16', end_date: null, graduated: false, created_at: '2024-05-01', child: mockChildren[1], cohort: mockCohorts[0] },
  { id: '3', child_id: '3', cohort_id: '2', start_date: '2024-05-16', end_date: null, graduated: false, created_at: '2024-05-01', child: mockChildren[2], cohort: mockCohorts[1] },
  { id: '4', child_id: '4', cohort_id: '2', start_date: '2024-05-16', end_date: null, graduated: false, created_at: '2024-05-01', child: mockChildren[3], cohort: mockCohorts[1] },
];

export const mockUsers: AppUser[] = [
  { id: '1', line_user_id: 'U001', role: 'teacher', status: 'active', display_name: 'Ms. Sarah', created_at: '2024-04-01' },
  { id: '2', line_user_id: 'U002', role: 'teacher', status: 'active', display_name: 'Mr. James', created_at: '2024-04-01' },
  { id: '3', line_user_id: 'U003', role: 'parent', status: 'active', display_name: 'Mrs. Johnson', created_at: '2024-05-01' },
  { id: '4', line_user_id: 'U004', role: 'parent', status: 'active', display_name: 'Mr. Smith', created_at: '2024-05-01' },
];

export const mockDailies: Daily[] = [
  { id: 'd1', cohort_id: '1', date: '2025-05-09', activity: 'Finger painting and storytelling', food: 'Fried rice with vegetables', fruit: 'Watermelon', note: 'Great participation today!', created_by: '1', updated_by: null, updated_at: null, created_at: '2025-05-09', cohort: mockCohorts[0] },
  { id: 'd2', cohort_id: '2', date: '2025-05-09', activity: 'Math games and singing', food: 'Noodle soup', fruit: 'Mango', note: null, created_by: '2', updated_by: null, updated_at: null, created_at: '2025-05-09', cohort: mockCohorts[1] },
];

export const mockAttendances: Attendance[] = [
  { id: 'a1', daily_id: 'd1', child_id: '1', status: 'present', note: null, created_by: '1', updated_by: null, updated_at: null, created_at: '2025-05-09', child: mockChildren[0] },
  { id: 'a2', daily_id: 'd1', child_id: '2', status: 'absent', note: 'Family trip', created_by: '1', updated_by: null, updated_at: null, created_at: '2025-05-09', child: mockChildren[1] },
  { id: 'a3', daily_id: 'd2', child_id: '3', status: 'present', note: null, created_by: '2', updated_by: null, updated_at: null, created_at: '2025-05-09', child: mockChildren[2] },
  { id: 'a4', daily_id: 'd2', child_id: '4', status: 'sick', note: 'Fever', created_by: '2', updated_by: null, updated_at: null, created_at: '2025-05-09', child: mockChildren[3] },
];

export const mockBehaviorCategories: BehaviorCategory[] = [
  { id: 'bc1', name_en: 'Social Skills', name_th: 'ทักษะสังคม', sort_order: 1, is_active: true, created_at: '2024-04-01', cohort_ids: [] },
  { id: 'bc2', name_en: 'Motor Skills', name_th: 'ทักษะการเคลื่อนไหว', sort_order: 2, is_active: true, created_at: '2024-04-01', cohort_ids: [] },
  { id: 'bc3', name_en: 'Learning & Cognitive', name_th: 'การเรียนรู้และความคิด', sort_order: 3, is_active: true, created_at: '2024-04-01', cohort_ids: [] },
];

export const mockBehaviorItems: BehaviorItem[] = [
  { id: 'bi1', category_id: 'bc1', name_en: 'Sharing with others', name_th: 'การแบ่งปัน', max_score: 3, sort_order: 1, is_active: true, created_at: '2024-04-01', category: mockBehaviorCategories[0] },
  { id: 'bi2', category_id: 'bc1', name_en: 'Following instructions', name_th: 'การทำตามคำสั่ง', max_score: 3, sort_order: 2, is_active: true, created_at: '2024-04-01', category: mockBehaviorCategories[0] },
  { id: 'bi3', category_id: 'bc2', name_en: 'Fine motor control', name_th: 'การควบคุมกล้ามเนื้อมือ', max_score: 3, sort_order: 1, is_active: true, created_at: '2024-04-01', category: mockBehaviorCategories[1] },
  { id: 'bi4', category_id: 'bc3', name_en: 'Problem solving', name_th: 'การแก้ปัญหา', max_score: 3, sort_order: 1, is_active: true, created_at: '2024-04-01', category: mockBehaviorCategories[2] },
];

export const mockDailyReports: DailyReport[] = [
  { id: 'dr1', daily_id: 'd1', child_id: '1', nap_from: '13:00', nap_to: '14:30', milk1: 'all', milk2: 'some', food_amount: 'all', fruit_amount: 'some', note: 'Good mood all day', created_by: '1', updated_by: null, updated_at: null, created_at: '2025-05-09', child: mockChildren[0] },
  { id: 'dr2', daily_id: 'd1', child_id: '2', nap_from: '13:15', nap_to: '14:00', milk1: 'skip', milk2: 'skip', food_amount: 'some', fruit_amount: 'skip', note: null, created_by: '1', updated_by: null, updated_at: null, created_at: '2025-05-09', child: mockChildren[1] },
];
