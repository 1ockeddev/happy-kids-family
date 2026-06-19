import { Book } from '@/components/icons';
import { DayEntry, AttendanceSummaryItem, Holiday, Activity } from './types';
import { parseLocalDate, generateWeeksWithReportMapping, calculateMonthSpans, getStatusColor } from './helpers';

interface ContributionGraphProps {
  attendanceSummary: AttendanceSummaryItem[];
  dayEntries: DayEntry[];
  enrollmentPeriod: { start: string; end: string | null } | null;
  holidays: Holiday[];
  activities: Activity[];
  dayIdx: number;
  onDaySelect: (idx: number) => void;
}

export default function ContributionGraph({
  attendanceSummary,
  dayEntries,
  enrollmentPeriod,
  holidays,
  activities,
  dayIdx,
  onDaySelect
}: ContributionGraphProps) {
  if (!enrollmentPeriod) return null;

  const weeks = generateWeeksWithReportMapping(attendanceSummary, dayEntries, enrollmentPeriod, holidays, activities);
  const monthSpans = calculateMonthSpans(weeks);

  if (weeks.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>ไม่มีข้อมูลการเข้าเรียน</div>;
  }

  return (
    <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            บันทึกรายวัน
          </span>
          {enrollmentPeriod && (
            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
              {parseLocalDate(enrollmentPeriod.start).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' - '}
              {enrollmentPeriod.end
                ? parseLocalDate(enrollmentPeriod.end).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'ปัจจุบัน'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', border: '2px solid #10b981' }} />
            <span style={{ color: '#64748b' }}>มา</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#c084fc' }} />
            <span style={{ color: '#64748b' }}>หยุดนักขัตฤกษ์</span>
          </div>
        </div>
      </div>

      <div
        id="calendar-scroll-container"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', overflowY: 'visible', padding: '4px 8px' }}
      >
        <div style={{ display: 'flex', gap: 3, minWidth: 'fit-content' }}>
          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Empty space for month labels row */}
            <div style={{ height: 14, marginBottom: 2 }} />
            {/* Day labels */}
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
              <div key={i} style={{ height: 10, fontSize: '0.6rem', color: '#94a3b8', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                {day}
              </div>
            ))}
          </div>

          {/* Month labels row + weeks grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Month labels row */}
            <div style={{ display: 'flex', gap: 3, height: 14, marginBottom: 2 }}>
              {monthSpans.map((span, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `calc(${span.weekCount} * 13px - ${span.weekCount > 1 ? '3px' : '0px'})`,
                    fontSize: '0.6rem',
                    color: '#64748b',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  {span.label}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            <div style={{ display: 'flex', gap: 3 }}>
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {week.days.map((day, dayIdxInWeek) => {
                    const isSelected = day.dayIdx === dayIdx;
                    const color = day.hasReport ? getStatusColor(day.status) : day.isHoliday ? '#c084fc' : getStatusColor(day.status);

                    // Build tooltip content
                    const dateLabel = day.date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
                    let statusLabel = '';

                    if (day.hasReport) {
                      statusLabel =
                        day.status === 'present'
                          ? 'มาเรียน'
                          : day.status === 'leave'
                            ? 'ลา'
                            : day.status === 'sick'
                              ? 'ป่วย'
                              : day.status === 'absent'
                                ? 'ขาดเรียน'
                                : 'ไม่มีข้อมูล';
                    } else if (day.isHoliday && day.holidayName) {
                      statusLabel = `🏖️ ${day.holidayName}`;
                    }

                    return (
                      <div key={dayIdxInWeek}>
                        <div
                          data-day-date={day.dateStr}
                          onClick={() => {
                            if (day.hasReport && day.dayIdx !== null) {
                              onDaySelect(day.dayIdx);
                              // Scroll to activity section after short delay
                              setTimeout(() => {
                                const activitySection = document.getElementById('todays-activity');
                                if (activitySection) {
                                  activitySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }
                          }}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: color,
                            opacity: day.hasReport ? 1.0 : day.isHoliday ? 0.8 : 0.5,
                            border: isSelected ? '2px solid #6366f1' : 'none',
                            cursor: day.hasReport ? 'pointer' : 'default',
                            flexShrink: 0,
                            transition: 'all .15s',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => {
                            if (day.hasReport) {
                              e.currentTarget.style.transform = 'scale(1.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
