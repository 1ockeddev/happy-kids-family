'use client';
import React from 'react';
import { DailyReport, Attendance, AppUser, MilkStatus } from '@/types';
import { BehaviorScore, DayEntry } from './types';
import { thDate } from './helpers';
import { SkRow, SkCircle } from './SharedUI';
import { Diaper, Toilet, FaceHappy, FaceSmile, FaceNeutral } from '@/components/icons';

interface DailyReportViewProps {
  report: DailyReport | null;
  attendance: Attendance | null;
  scores: BehaviorScore[];
  teacher: AppUser | null;
  currentEntry: DayEntry | null;
  reportLoading: boolean;
  behaviorGroups: Record<string, { name_th: string; items: BehaviorScore[] }>;
}

// Helper function to get badge colors based on status
const getStatusBadgeStyle = (status: MilkStatus) => {
  const styles = {
    all: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },      // เขียว
    some: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },     // เหลือง
    not_must: { bg: '#fed7aa', color: '#c2410c', border: '#fdba74' }, // ส้ม
    skip: { bg: '#e2e8f0', color: '#64748b', border: '#cbd5e1' }      // เทา
  };
  return styles[status] || styles.skip;
};

const getStatusLabel = (status: MilkStatus) => {
  const labels = {
    all: 'ทานหมด',
    some: 'บางส่วน',
    not_must: 'นิดหน่อย',
    skip: 'ข้าม'
  };
  return labels[status] || 'ข้าม';
};

export default function DailyReportView({
  report,
  attendance,
  scores,
  teacher,
  currentEntry,
  reportLoading,
  behaviorGroups
}: DailyReportViewProps) {
  const exDiaper = report?.excretions?.filter((e) => e.action === 'diaper') ?? [];
  const exPotty = report?.excretions?.filter((e) => e.action === 'potty') ?? [];

  if (reportLoading) {
    return <LoadingSkeleton />;
  }

  // If no data at all, show empty state
  if (!report && !attendance) {
    return null;
  }

  return (
    <div>
      {/* Attendance Card */}
      {attendance && <AttendanceCard attendance={attendance} report={report} />}

      {/* Activity Card */}
      {report?.daily?.activity && <ActivityCard activity={report.daily.activity} />}

      {/* Teacher Note Card */}
      {report?.note && <TeacherNoteCard note={report.note} />}

      {/* Food & Milk Section */}
      {report && <FoodMilkSection report={report} />}

      {/* Behavior Section */}
      {scores.length > 0 && <BehaviorSection behaviorGroups={behaviorGroups} />}

      {/* Nap Timeline */}
      {report && <NapTimeline report={report} />}

      {/* Excretion Section */}
      {(exDiaper.length > 0 || exPotty.length > 0) && <ExcretionSection exDiaper={exDiaper} exPotty={exPotty} />}

      {/* Teacher Footer */}
      <TeacherFooter teacher={teacher} currentEntry={currentEntry} />
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <SkRow h={20} mb={10} />
        <SkRow w="60%" h={14} mb={0} />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 18,
            marginBottom: 14,
            border: '1px solid #e2e8f0'
          }}
        >
          <SkRow h={20} mb={10} />
          <SkRow h={14} mb={8} />
          <SkRow w="80%" h={14} mb={0} />
        </div>
      ))}
    </div>
  );
}

/* ─── Attendance Card ─────────────────────────────── */
interface AttendanceCardProps {
  attendance: Attendance;
  report: DailyReport | null;
}

function AttendanceCard({ attendance, report }: AttendanceCardProps) {
  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    present: { label: 'มาเรียน', bg: '#ecfdf5', color: '#10b981' },
    absent: { label: 'ขาดเรียน', bg: '#fef2f2', color: '#ef4444' },
    sick: { label: 'ป่วย', bg: '#fffbeb', color: '#f59e0b' },
    leave: { label: 'ลา', bg: '#eff6ff', color: '#3b82f6' }
  };

  const status = statusMap[attendance.status] || statusMap.present;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '18px',
        marginBottom: 14,
        border: '1px solid #e2e8f0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#334155',
            fontFamily: 'Prompt, sans-serif'
          }}
        >
          📚 สถานะวันนี้
        </span>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: 12,
            fontSize: '0.85rem',
            fontWeight: 700,
            background: status.bg,
            color: status.color
          }}
        >
          {status.label}
        </span>
      </div>
      {(attendance.note) && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: '#f8fafc',
            borderRadius: 10,
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.5
          }}
        >
          <i className="bi bi-chat-left-text-fill" style={{ color: status.color, marginRight: 6 }}></i>
          {attendance.note}
        </div>
      )}
    </div>
  );
}

/* ─── Activity Card ─────────────────────────────── */
interface ActivityCardProps {
  activity: string;
}

function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div
      id="todays-activity"
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 14,
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          color: '#6366f1',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          display: 'block',
          marginBottom: 6
        }}
      >
        TODAY'S ACTIVITY
      </span>
      <h2
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          letterSpacing: '-0.2px'
        }}
      >
        {activity}
      </h2>
    </div>
  );
}

/* ─── Teacher Note Card ─────────────────────────────── */
interface TeacherNoteCardProps {
  note: string;
}

function TeacherNoteCard({ note }: TeacherNoteCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '18px',
        marginBottom: 14,
        border: '1px solid #e2e8f0'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          marginBottom: 10,
          color: '#334155',
          gap: 8,
          fontFamily: 'Prompt, sans-serif'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        ข้อความจากครู
      </div>
      <p style={{ color: '#475569', lineHeight: 1.6, margin: 0 }}>{note}</p>
    </div>
  );
}

/* ─── Food & Milk Section ─────────────────────────────── */
interface FoodMilkSectionProps {
  report: DailyReport;
}

function FoodMilkSection({ report }: FoodMilkSectionProps) {
  // Check if there's any food/milk data to display
  const hasFood = report.food_amount && report.food_amount !== 'skip';
  const hasFruit = report.fruit_amount && report.fruit_amount !== 'skip';
  const hasMilk = (report.milk1 && report.milk1 !== 'skip') || (report.milk2 && report.milk2 !== 'skip');
  
  // Get food and fruit items from daily
  const foodItems = report.daily?.food ? report.daily.food.split(',').map(f => f.trim()).filter(Boolean) : [];
  const fruitItems = report.daily?.fruit ? report.daily.fruit.split(',').map(f => f.trim()).filter(Boolean) : [];
  
  // If no food/milk data, don't render
  if (!hasFood && !hasFruit && !hasMilk) {
    return null;
  }

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '18px',
        marginBottom: 14,
        border: '1px solid #e2e8f0'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          marginBottom: 16,
          color: '#334155',
          gap: 8,
          fontFamily: 'Prompt, sans-serif'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
        อาหารและโภชนาการ
      </div>

      {/* Food & Fruit */}
      {(hasFood || hasFruit) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: hasMilk ? 18 : 0 }}>
          {hasFood && (
            <div
              style={{
                padding: 14,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: 14,
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: foodItems.length > 0 ? 10 : 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                  </svg>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>อาหารกลางวัน</span>
                </div>
                {report.food_amount && report.food_amount !== 'skip' && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: getStatusBadgeStyle(report.food_amount).bg,
                      color: getStatusBadgeStyle(report.food_amount).color,
                      border: `1px solid ${getStatusBadgeStyle(report.food_amount).border}`
                    }}
                  >
                    {getStatusLabel(report.food_amount)}
                  </span>
                )}
              </div>
              {/* Food items list */}
              {foodItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {foodItems.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'white',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        color: '#475569',
                        fontWeight: 600,
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {report.food_note && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    lineHeight: 1.5,
                    marginTop: 10,
                    paddingLeft: 10,
                    borderLeft: '2px solid #94a3b8'
                  }}
                >
                  {report.food_note}
                </div>
              )}
            </div>
          )}

          {hasFruit && (
            <div
              style={{
                padding: 14,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: 14,
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: fruitItems.length > 0 ? 10 : 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 512 512" fill="#64748b" opacity="0.8">
                    <path d="M445.618,228.059h-42.029l27.986-43.14c1.954-3.012,1.096-7.037-1.916-8.991c-3.011-1.953-7.036-1.097-8.99,1.916l-32.576,50.215h-70.124c-2.758-63.71-45.818-114.503-98.357-114.503c-46.697,0-86.652,40.321-96.29,95.396C95.139,188.996,75.1,164.417,70.731,143.56c-1.033-4.947-4.933-8.683-9.936-9.518c-4.923-0.823-9.735,1.366-12.333,5.579c-0.116,0.18-0.21,0.344-0.287,0.487c-8.978,15.282-11.588,33.751-7.811,52.788c-4.686-4.875-8.418-9.9-10.996-14.962c-2.297-4.498-7.044-7.077-12.088-6.572c-5.022,0.502-9.144,3.953-10.5,8.801l-0.047,0.17c-7.67,27.815,2.96,57.899,27.076,81.47c-5.247-2.475-9.847-5.33-13.638-8.552c-3.893-3.31-9.313-3.891-13.809-1.481c-4.399,2.358-6.863,7.083-6.276,12.036l0.034,0.276c2.977,23.833,18.146,44.562,42.713,58.368c18.833,10.583,41.506,16.112,65.323,16.111c6.442,0,12.972-0.405,19.526-1.223c15.844-1.979,30.252-5.563,42.955-10.496c14.35,7.672,31.206,11.714,48.975,11.714c26.114,0,49.632-8.628,66.982-24.424c16.946,15.588,39.94,24.427,67.025,24.427c58.916,0,98.5-41.794,98.5-104C452.118,230.969,449.208,228.059,445.618,228.059z M201.131,133.386c0,0.477-2,2.5-6,2.5c-3.508,0-5.476-1.555-5.908-2.259c2.088-1.007,4.215-1.91,6.375-2.711C199.273,131.07,201.131,132.928,201.131,133.386z" />
                  </svg>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>ผลไม้</span>
                </div>
                {report.fruit_amount && report.fruit_amount !== 'skip' && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: getStatusBadgeStyle(report.fruit_amount).bg,
                      color: getStatusBadgeStyle(report.fruit_amount).color,
                      border: `1px solid ${getStatusBadgeStyle(report.fruit_amount).border}`
                    }}
                  >
                    {getStatusLabel(report.fruit_amount)}
                  </span>
                )}
              </div>
              {/* Fruit items list */}
              {fruitItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {fruitItems.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'white',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        color: '#475569',
                        fontWeight: 600,
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {report.fruit_note && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    lineHeight: 1.5,
                    marginTop: 10,
                    paddingLeft: 10,
                    borderLeft: '2px solid #94a3b8'
                  }}
                >
                  {report.fruit_note}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Milk Section */}
      {hasMilk && (
        <div>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#475569',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" />
              <path d="M6 6h12" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            การดื่มนมประจำวัน
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'กล่องที่ 1 (เช้า)', val: report.milk1, note: report.milk1_note },
              { label: 'กล่องที่ 2 (บ่าย)', val: report.milk2, note: report.milk2_note }
            ]
              .filter((m) => m.val !== 'skip')
              .map((m) => (
                <div
                  key={m.label}
                  style={{
                    padding: 12,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{m.label}</span>
                    {m.val !== 'skip' && (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: getStatusBadgeStyle(m.val as MilkStatus).bg,
                          color: getStatusBadgeStyle(m.val as MilkStatus).color,
                          border: `1px solid ${getStatusBadgeStyle(m.val as MilkStatus).border}`
                        }}
                      >
                        {getStatusLabel(m.val as MilkStatus)}
                      </span>
                    )}
                  </div>
                  {m.note && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 8, lineHeight: 1.5, paddingLeft: 10, borderLeft: '2px solid #94a3b8' }}>
                      {m.note}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Behavior Section ─────────────────────────────── */
interface BehaviorSectionProps {
  behaviorGroups: Record<string, { name_th: string; items: BehaviorScore[] }>;
}

function BehaviorSection({ behaviorGroups }: BehaviorSectionProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '18px',
        marginBottom: 14,
        border: '1px solid #e2e8f0'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          marginBottom: 16,
          color: '#334155',
          gap: 8,
          fontFamily: 'Prompt, sans-serif'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        อุปนิสัยวันนี้
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.values(behaviorGroups).map((g) => (
          <div key={g.name_th}>
            <p
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#7c3aed',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {g.name_th}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.items.map((s) => {
                const percentage = (s.score / s.max_score) * 100;

                let faceIcon: React.ReactElement;
                let iconColor: string;

                const bgColor = '#f8fafc';
                const borderColor = '#e2e8f0';

                if (percentage >= 80) {
                  faceIcon = <FaceHappy size={24} color="#10b981" />;
                  iconColor = '#10b981';
                } else if (percentage >= 60) {
                  faceIcon = <FaceSmile size={24} color="#facc15" />;
                  iconColor = '#facc15';
                } else {
                  faceIcon = <FaceNeutral size={24} color="#f97316" />;
                  iconColor = '#f97316';
                }

                return (
                  <div
                    key={s.item_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      gap: 12
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>{faceIcon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{s.name_th}</div>
                      {s.note && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#475569',
                            lineHeight: 1.5,
                            marginTop: 8,
                            padding: '8px 10px',
                            background: 'white',
                            borderRadius: 8,
                            border: `1px dashed ${iconColor}`
                          }}
                        >
                          <i className="bi bi-chat-left-text-fill" style={{ color: iconColor, fontSize: '0.7rem', marginRight: 6 }}></i>
                          {s.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Nap Timeline ─────────────────────────────── */
interface NapTimelineProps {
  report: DailyReport;
}

function NapTimeline({ report }: NapTimelineProps) {
  // If no nap data at all, don't render
  if (!report.nap_from && !report.nap_to && !report.nap_note) {
    return null;
  }

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return { hours: h, minutes: m, totalMinutes: h * 60 + m };
  };

  const getDuration = (from: string, to: string) => {
    const d = (new Date('2000-01-01T' + to).getTime() - new Date('2000-01-01T' + from).getTime()) / 60000;
    const hours = Math.floor(d / 60);
    const minutes = Math.round(d % 60);
    
    if (hours === 0) {
      return `${minutes} นาที`;
    } else if (minutes === 0) {
      return `${hours} ชม.`;
    } else {
      return `${hours} ชม. ${minutes} นาที`;
    }
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '20px',
        marginBottom: 14,
        border: '1px solid #e2e8f0'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#334155',
            gap: 8,
            fontFamily: 'Prompt, sans-serif'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5" />
            <path d="M7 14c2 3 8 3 10 0" />
          </svg>
          การนอนกลางวัน
        </div>
        {report.nap_from && report.nap_to && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b' }}>
              {getDuration(report.nap_from, report.nap_to)}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700 }}>
              {report.nap_from.slice(0, 5)} - {report.nap_to.slice(0, 5)} น.
            </span>
          </div>
        )}
      </div>

      {report.nap_from && report.nap_to ? (
        (() => {
          const startTime = parseTime(report.nap_from);
          const endTime = parseTime(report.nap_to);

          // Timeline settings
          const dayStart = 9 * 60; // 09:00
          const dayMid = 12 * 60; // 12:00
          const dayEnd = 14.5 * 60; // 14:30
          const totalRange = dayEnd - dayStart;

          // Calculate positions
          const napStart = Math.max(startTime.totalMinutes, dayStart);
          const napEnd = Math.min(endTime.totalMinutes, dayEnd);
          const napLeftPercent = ((napStart - dayStart) / totalRange) * 100;
          const napWidthPercent = ((napEnd - napStart) / totalRange) * 100;

          // Light blue background (extended nap area)
          const bgStart = Math.max(dayMid, dayStart);
          const bgEnd = dayEnd;
          const bgLeftPercent = ((bgStart - dayStart) / totalRange) * 100;
          const bgWidthPercent = ((bgEnd - bgStart) / totalRange) * 100;

          // Calculate clock angles
          const getAngle = (hours: number, minutes: number) => {
            const totalMin = (hours % 12) * 60 + minutes;
            return (totalMin / 720) * 360;
          };

          const startAngle = getAngle(startTime.hours, startTime.minutes);
          const startPercent = (startAngle / 360) * 100;

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              {/* Analog Clock */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: `conic-gradient(#e2e8f0 0% ${startPercent}%, #818cf8 ${startPercent}% ${startPercent + 0.5}%, #e2e8f0 ${startPercent + 0.5}% 100%)`,
                  position: 'relative',
                  flexShrink: 0,
                  border: '2px solid #f8fafc'
                }}
              >
                {/* Hour hand */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '1.5px',
                    height: '20px',
                    background: '#60a5fa',
                    transform: `translate(-50%, -100%) rotate(${startAngle}deg)`,
                    transformOrigin: 'bottom'
                  }}
                ></div>
                {/* Minute hand */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '1.5px',
                    height: '20px',
                    background: '#60a5fa',
                    transform: `translate(-50%, -100%) rotate(${startAngle + 60}deg)`,
                    transformOrigin: 'bottom'
                  }}
                ></div>
                {/* Center dot */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '4px',
                    height: '4px',
                    background: '#4338ca',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>

              {/* Timeline */}
              <div style={{ flex: 1, position: 'relative', paddingTop: 15 }}>
                {/* Top time labels */}
                <div style={{ position: 'absolute', top: 0, width: '100%', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>
                  <span style={{ position: 'absolute', left: 0, transform: 'translateX(-50%)' }}>09:00</span>
                  <span style={{ position: 'absolute', left: `${bgLeftPercent}%`, transform: 'translateX(-50%)' }}>12:00</span>
                  <span style={{ position: 'absolute', right: 0, transform: 'translateX(50%)' }}>14:30</span>
                </div>

                {/* Timeline bar */}
                <div
                  style={{
                    width: '100%',
                    height: 10,
                    background: '#f1f5f9',
                    borderRadius: 5,
                    position: 'relative',
                    overflow: 'hidden',
                    margin: '5px 0'
                  }}
                >
                  {/* Light blue background area */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${bgLeftPercent}%`,
                      width: `${bgWidthPercent}%`,
                      height: '100%',
                      background: '#e0f2fe'
                    }}
                  ></div>
                  {/* Actual nap time (dark blue) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${napLeftPercent}%`,
                      width: `${napWidthPercent}%`,
                      height: '100%',
                      background: '#818cf8',
                      borderRadius: 5
                    }}
                  ></div>
                </div>

                {/* Bottom labels */}
                <div style={{ position: 'relative', width: '100%', height: 12, fontSize: '0.6rem', fontWeight: 700, color: '#cbd5e1' }}>
                  <span style={{ position: 'absolute', left: 0, transform: 'translateX(-50%)' }}>START</span>
                  <span style={{ position: 'absolute', left: `${napLeftPercent}%`, transform: 'translateX(-50%)', color: '#4338ca' }}>
                    {report.nap_from.slice(0, 5)}
                  </span>
                  <span
                    style={{ position: 'absolute', left: `${napLeftPercent + napWidthPercent}%`, transform: 'translateX(-50%)', color: '#4338ca' }}
                  >
                    {report.nap_to.slice(0, 5)}
                  </span>
                  <span style={{ position: 'absolute', left: '100%', transform: 'translateX(-50%)' }}>END</span>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>
          <p style={{ marginBottom: report.nap_note ? 6 : 0 }}>ไม่ได้นอนกลางวัน</p>
          {report.nap_note && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: 8,
                padding: '8px 12px',
                marginTop: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  หมายเหตุ
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0, lineHeight: 1.5 }}>{report.nap_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Excretion Section ─────────────────────────────── */
interface ExcretionSectionProps {
  exDiaper: any[];
  exPotty: any[];
}

function ExcretionSection({ exDiaper, exPotty }: ExcretionSectionProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '18px',
        marginBottom: 14,
        border: '1px solid #e2e8f0'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          marginBottom: 14,
          color: '#334155',
          gap: 8,
          fontFamily: 'Prompt, sans-serif'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        การขับถ่าย
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {exDiaper.length > 0 && (
          <div style={{ background: '#fff7ed', padding: 14, borderRadius: 14, border: '1px solid #ffedd5' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c2410c', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Diaper size={16} color="#c2410c" />
              ผ้าอ้อม (Diapers)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'ฉี่ (Wet)', items: exDiaper.filter((e) => e.type === 'pee') },
                { label: 'อึ (Soiled)', items: exDiaper.filter((e) => e.type === 'poo') }
              ]
                .filter((g) => g.items.length > 0)
                .map((g) => (
                  <div key={g.label} style={{ background: 'white', padding: 8, borderRadius: 10, textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#9a3412' }}>{g.label}</span>
                    <span style={{ fontWeight: 700, color: '#4a5568' }}>{g.items.length} ครั้ง</span>
                    <small style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>
                      {g.items
                        .map((e) => e.time?.slice(0, 5))
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </small>
                  </div>
                ))}
            </div>
          </div>
        )}
        {exPotty.length > 0 && (
          <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 14, border: '1px solid #dcfce7' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Toilet size={16} color="#15803d" />
              นั่งกระโถน (Potty)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'ฉี่ (Pee)', items: exPotty.filter((e) => e.type === 'pee') },
                { label: 'อึ (Poo)', items: exPotty.filter((e) => e.type === 'poo') }
              ]
                .filter((g) => g.items.length > 0)
                .map((g) => (
                  <div key={g.label} style={{ background: 'white', padding: 8, borderRadius: 10, textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#166534' }}>{g.label}</span>
                    <span style={{ fontWeight: 700, color: '#4a5568' }}>{g.items.length} ครั้ง</span>
                    <small style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>
                      {g.items
                        .map((e) => e.time?.slice(0, 5))
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </small>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Teacher Footer ─────────────────────────────── */
interface TeacherFooterProps {
  teacher: AppUser | null;
  currentEntry: DayEntry | null;
}

function TeacherFooter({ teacher, currentEntry }: TeacherFooterProps) {
  return (
    <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
      <p style={{ margin: '2px 0', color: '#94a3b8', fontSize: '0.8rem' }}>บันทึกโดยคุณครู</p>
      <p style={{ margin: '2px 0', color: '#475569', fontWeight: 600, fontSize: '0.88rem' }}>
        {teacher?.display_name ?? 'Happy Kids'}
      </p>
      {currentEntry && <p style={{ marginTop: 8, fontSize: '0.72rem', color: '#94a3b8' }}>{thDate(currentEntry.date)}</p>}
    </div>
  );
}
