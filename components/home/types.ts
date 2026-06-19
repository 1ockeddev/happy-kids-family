import { MilkStatus, ExcretionType, ExcretionAction } from '@/types';

export interface BehaviorScore {
  item_id: string;
  name_th: string;
  name_en: string;
  score: number;
  max_score: number;
  category_id: string;
  category_name_th: string;
  note?: string;
}

export interface DayEntry {
  date: string;
  daily_id: string;
  report_id: string | null;
}

export interface DateSquare {
  date: Date;
  dateStr: string;
  status: string | null;
  hasReport: boolean;
  dayIdx: number | null;
  isHoliday: boolean;
  holidayName?: string;
  activity?: string;
}

export interface WeekColumn {
  days: DateSquare[];
  monthLabel: string;
}

export interface MonthSpan {
  label: string;
  startWeekIdx: number;
  weekCount: number;
}

export interface BehaviorSummaryItem {
  item_id: string;
  name_th: string;
  category_name_th: string;
  avg_score: number;
  max_score: number;
  daily_scores: { date: string; score: number }[];
  days_recorded: number;
}

export interface AllBehaviorScore {
  id: string;
  score: number;
  note: string | null;
  date: string;
  item_id: string;
  item_name_th: string;
  item_name_en: string;
  max_score: number;
  category_id: string;
  category_name_th: string;
  category_name_en: string;
}

export interface FoodSummary {
  food: { food_amount: MilkStatus; count: number }[];
  fruit: { fruit_amount: MilkStatus; count: number }[];
  milk1: { milk_amount: MilkStatus; count: number }[];
  milk2: { milk_amount: MilkStatus; count: number }[];
  nap: {
    total_days: number;
    nap_days: number;
    avg_hours: number | null;
    max_hours?: number | null;
    min_hours?: number | null;
  };
  excretions: { type: ExcretionType; action: ExcretionAction; count: number }[];
}

export interface Holiday {
  date: string;
  name_th: string;
}

export interface Activity {
  date: string;
  activity: string;
}

export interface AttendanceSummaryItem {
  date: string;
  status: string;
}
