import { DayEntry, DateSquare, WeekColumn, MonthSpan, Holiday, Activity, AttendanceSummaryItem } from './types';

// Parse YYYY-MM-DD string as local date (not UTC to avoid timezone shift)
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Map attendance status to color
export const getStatusColor = (status: string | null): string => {
  if (!status) return '#e2e8f0';
  switch (status) {
    case 'present':
      return '#10b981';
    case 'leave':
      return '#f59e0b';
    case 'sick':
      return '#fbbf24';
    case 'absent':
      return '#ef4444';
    default:
      return '#e2e8f0';
  }
};

// Format month label in Thai abbreviation
export const formatMonthLabel = (date: Date): string => {
  return date.toLocaleDateString('th-TH', { month: 'short' });
};

// Find dayIdx for a given date string in dayEntries array
export const findDayIdxForDate = (dateStr: string, dayEntries: DayEntry[]): number | null => {
  const idx = dayEntries.findIndex((entry) => entry.date === dateStr);
  return idx >= 0 ? idx : null;
};

// Generate weeks with report mapping
export const generateWeeksWithReportMapping = (
  attendanceSummary: AttendanceSummaryItem[],
  dayEntries: DayEntry[],
  enrollmentPeriod: { start: string; end: string | null } | null,
  holidays: Holiday[],
  activities: Activity[]
): WeekColumn[] => {
  // Use enrollment period if available, otherwise fall back to attendance summary
  let firstDate: Date;
  let lastDate: Date;

  if (enrollmentPeriod) {
    firstDate = parseLocalDate(enrollmentPeriod.start);
    // Use end_date if exists, otherwise use today (in local timezone)
    if (enrollmentPeriod.end) {
      lastDate = parseLocalDate(enrollmentPeriod.end);
    } else {
      // Get today's date in YYYY-MM-DD format (local timezone)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      lastDate = parseLocalDate(todayStr);
    }
  } else if (attendanceSummary.length > 0) {
    firstDate = parseLocalDate(attendanceSummary[0].date);
    lastDate = parseLocalDate(attendanceSummary[attendanceSummary.length - 1].date);
  } else {
    return [];
  }

  // Start from Sunday of first week
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // End at Saturday of last week
  const endDate = new Date(lastDate);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // Create date maps for O(1) lookup
  const dateMap = new Map(attendanceSummary.map((d) => [d.date, d.status]));
  const dayEntriesMap = new Map(dayEntries.map((entry, idx) => [entry.date, { idx, hasReport: !!entry.report_id }]));
  const holidaysMap = new Map(holidays.map((h) => [h.date, h.name_th]));
  const activitiesMap = new Map(activities.map((a) => [a.date, a.activity]));

  // Generate weeks
  const weeks: WeekColumn[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const week: DateSquare[] = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const status = dateMap.get(dateStr) ?? null;
      const dayEntryData = dayEntriesMap.get(dateStr);
      const dayIdx = dayEntryData?.idx ?? null;
      const hasReport = dayEntryData?.hasReport ?? false;
      const isHoliday = holidaysMap.has(dateStr);
      const holidayName = holidaysMap.get(dateStr);
      const activity = activitiesMap.get(dateStr);

      week.push({
        date: new Date(currentDate),
        dateStr,
        status,
        hasReport,
        dayIdx,
        isHoliday,
        holidayName,
        activity
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push({ days: week, monthLabel: '' });
  }

  return weeks;
};

// Calculate month spans for header row
export const calculateMonthSpans = (weeks: WeekColumn[]): MonthSpan[] => {
  if (!weeks.length) return [];

  const monthSpans: MonthSpan[] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let currentSpan: MonthSpan | null = null;

  weeks.forEach((week, weekIdx) => {
    const firstDayOfWeek = week.days[0].date;
    const month = firstDayOfWeek.getMonth();
    const year = firstDayOfWeek.getFullYear();

    if (month !== currentMonth || year !== currentYear) {
      // New month started
      if (currentSpan !== null) {
        monthSpans.push(currentSpan);
      }

      currentMonth = month;
      currentYear = year;
      currentSpan = {
        label: formatMonthLabel(firstDayOfWeek),
        startWeekIdx: weekIdx,
        weekCount: 1
      };
    } else {
      // Same month continues
      if (currentSpan) {
        currentSpan.weekCount++;
      }
    }
  });

  // Add final month span
  if (currentSpan !== null) {
    monthSpans.push(currentSpan);
  }

  return monthSpans;
};

// Parse date string
export const parseDate = (d?: string | null) => {
  if (!d) return null;
  const s = d.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? parseLocalDate(s) : null;
};

// Format date in Thai
export const thDate = (d?: string | null) =>
  parseDate(d)?.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? '';
