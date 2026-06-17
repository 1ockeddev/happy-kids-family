export type AttendanceStatus = 'present' | 'absent' | 'sick' | 'leave';
export type MilkStatus = 'all' | 'some' | 'not_must' | 'skip';
export type ExcretionType = 'pee' | 'poo';
export type ExcretionAction = 'diaper' | 'potty';
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'parent';
export type UserStatus = 'active' | 'inactive';

export interface AppUser {
  id: string; line_user_id: string | null; role: UserRole; status: UserStatus;
  display_name: string | null; line_display_name: string | null; picture_url: string | null; created_at: string;
  can_select_cohort?: boolean; // Teacher can select cohort or forced to default
  default_cohort_id?: string | null; // Default cohort for teacher
}
export interface Child {
  id: string; 
  name_en: string | null; 
  name_th: string | null;
  firstname_en: string | null;
  lastname_en: string | null;
  firstname_th: string | null;
  lastname_th: string | null;
  nickname_en: string | null;
  nickname_th: string | null;
  birthdate: string | null;
  photo_url: string | null; 
  deleted_at: string | null; 
  created_at: string;
}
export interface Cohort {
  id: string; name: string | null; level: string | null;
  academic_year: number | null; start_date: string; end_date: string; created_at: string;
}
export interface Enrollment {
  id: string; child_id: string; cohort_id: string;
  start_date: string; end_date: string | null; graduated: boolean; created_at: string;
  child?: Child; cohort?: Cohort;
}
export interface Daily {
  id: string; cohort_id: string; date: string;
  activity: string | null; food: string | null; fruit: string | null; note: string | null;
  created_by: string | null; updated_by: string | null; updated_at: string | null; created_at: string;
  cohort?: Cohort;
}
export interface Attendance {
  id: string; daily_id: string; child_id: string; status: AttendanceStatus; note: string | null;
  created_by: string | null; updated_by: string | null; updated_at: string | null; created_at: string;
  child?: Child;
}

export interface DailyReport {
  id: string; daily_id: string; child_id: string;
  nap_from: string | null; nap_to: string | null; nap_note: string | null;
  milk1: MilkStatus; milk1_note: string | null;
  milk2: MilkStatus; milk2_note: string | null;
  food_amount: MilkStatus; food_note: string | null;
  fruit_amount: MilkStatus; fruit_note: string | null;
  note: string | null;
  created_by: string | null; updated_by: string | null; updated_at: string | null; created_at: string;
  child?: Child;
  daily?: Pick<Daily, 'id' | 'date' | 'activity' | 'food' | 'fruit'> & { cohort?: Pick<Cohort, 'id' | 'name'> };
  excretions?: ChildExcretion[];
}

export interface BehaviorCategory {
  id: string; name_en: string; name_th: string; sort_order: number;
  is_active: boolean; created_at: string;
  cohort_ids: string[];   // UUID[] — ผูกกับห้องเรียน
}
export interface BehaviorItem {
  id: string; category_id: string; name_en: string; name_th: string;
  max_score: number; sort_order: number; is_active: boolean; created_at: string;
  category?: BehaviorCategory;
}
export interface ChildBehaviorScore {
  id: string; daily_id: string; child_id: string; item_id: string;
  score: number | null; note: string | null; created_at: string;
}
export interface ChildExcretion {
  id: string; daily_id: string; child_id: string;
  time: string | null; type: ExcretionType | null; action: ExcretionAction | null;
  created_at: string;
}
export interface TeacherPermission {
  user_id: string; can_manage_daily: boolean;
  can_manage_attendance: boolean; can_manage_report: boolean;
}
