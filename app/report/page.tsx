'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Child, DailyReport, Attendance, MilkStatus, ExcretionType, ExcretionAction } from '@/types';
import BehaviorSummary from '@/components/report/BehaviorSummary';

/* ─── label maps ──────────────────────────────── */
const amtL: Record<MilkStatus, string> = { all: 'ทานหมด', some: 'ทานครึ่งเดียว', not_must: 'ไม่จำเป็น', skip: 'ไม่ทาน' };
const amtStyle: Record<MilkStatus, { bg: string; color: string }> = {
  all:      { bg: '#dcfce7', color: '#166534' },
  some:     { bg: '#fef9c3', color: '#854d0e' },
  not_must: { bg: '#dbeafe', color: '#1e40af' },
  skip:     { bg: '#ffe4e6', color: '#9f1239' },
};
const attL: Record<string, string>  = { present: '😊 มาเรียน', absent: '😴 ขาดเรียน', sick: '🤒 ป่วย', leave: '📝 ลา' };
const attC: Record<string, string>  = { present: '#10b981', absent: '#ef4444', sick: '#f59e0b', leave: '#3b82f6' };
const attBg: Record<string, string> = { present: '#ecfdf5', absent: '#fef2f2', sick: '#fffbeb', leave: '#eff6ff' };

interface BehaviorScore {
  item_id: string; score: number; max_score: number;
  name_th: string; name_en: string;
  category_id: string; category_name_th: string; category_name_en: string;
}
interface DayEntry { date: string; daily_id: string; report_id: string | null; }

/* ─── helpers ─────────────────────────────────── */
// รับ YYYY-MM-DD หรือ ISO timestamp แล้ว return Date object local
const parseDate = (d: string | null | undefined): Date | null => {
  if (!d) return null;
  const s = d.slice(0, 10); // ตัดเหลือแค่ YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(s + 'T00:00:00');
};
const thDate = (d: string | null | undefined) => {
  const dt = parseDate(d);
  return dt ? dt.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
};
const thShort = (d: string | null | undefined) => {
  const dt = parseDate(d);
  return dt ? dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
};

/* ─── sub-components ──────────────────────────── */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 14, overflow: 'hidden', ...style }}>
    {children}
  </div>
);

const CardHeader = ({ emoji, title, color = '#4338ca' }: { emoji: string; title: string; color?: string }) => (
  <div style={{ background: '#f8fafc', padding: '13px 18px', borderBottom: `2px solid ${color}`, display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color, letterSpacing: 0.3 }}>{title}</h2>
  </div>
);

const StatusPill = ({ status }: { status: MilkStatus }) => (
  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: amtStyle[status].bg, color: amtStyle[status].color }}>
    {amtL[status]}
  </span>
);

/* ─── NapTimeline ──────────────────────────────── */
function NapTimeline({ from, to }: { from: string | null; to: string | null }) {
  if (!from || !to) {
    return (
      <div style={{ padding: '14px 18px', color: '#9CA3AF', fontSize: '0.9rem', textAlign: 'center' }}>
        ไม่ได้นอนกลางวัน
      </div>
    );
  }
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const start = 9 * 60, end = 15 * 60, total = end - start;
  const napStart = toMin(from), napEnd = toMin(to);
  const left = ((napStart - start) / total) * 100;
  const width = ((napEnd - napStart) / total) * 100;
  const dur = napEnd - napStart;
  const durStr = dur >= 60 ? `${Math.floor(dur/60)} ชม. ${dur%60 > 0 ? `${dur%60} นาที` : ''}` : `${dur} นาที`;

  return (
    <div style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e1b4b' }}>{durStr}</span>
        <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>{from.slice(0,5)} – {to.slice(0,5)} น.</span>
      </div>
      <div style={{ position: 'relative', paddingTop: 16 }}>
        <div style={{ position: 'absolute', top: 0, width: '100%', fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700 }}>
          <span style={{ position: 'absolute', left: 0 }}>09:00</span>
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>12:00</span>
          <span style={{ position: 'absolute', right: 0 }}>15:00</span>
        </div>
        <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden', margin: '6px 0' }}>
          <div style={{ position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: '100%', background: '#818cf8', borderRadius: 5 }} />
          </div>
        </div>
        <div style={{ position: 'relative', height: 14, fontSize: '0.65rem', fontWeight: 700, color: '#4338ca' }}>
          <span style={{ position: 'absolute', left: `${left}%`, transform: 'translateX(-50%)' }}>{from.slice(0,5)}</span>
          <span style={{ position: 'absolute', left: `${left + width}%`, transform: 'translateX(-50%)' }}>{to.slice(0,5)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── CalendarStrip ─────────────────────────── */
function CalendarStrip({ entries, currentIdx, onSelect }: {
  entries: DayEntry[];
  currentIdx: number;
  onSelect: (i: number) => void;
}) {
  if (entries.length === 0) return null;

  const dateMap = new Map(entries.map((e, i) => [e.date, i]));
  const now = new Date();

  // free navigation — ไม่ lock กับ minDate/maxDate
  const [viewYear,  setViewYear]  = useState(() => {
    const d = parseDate(entries[currentIdx]?.date) ?? now;
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseDate(entries[currentIdx]?.date) ?? now;
    return d.getMonth(); // 0-based
  });
  const [picking, setPicking] = useState<'month' | 'year' | null>(null);

  // sync เฉพาะตอน entries ชุดใหม่โหลดมา (เปลี่ยนเด็ก)
  // ไม่ sync ตาม currentIdx เพื่อให้ user เลื่อนปฏิทินได้อิสระ
  const prevEntriesRef = React.useRef(entries);
  useEffect(() => {
    if (prevEntriesRef.current !== entries) {
      prevEntriesRef.current = entries;
      const d = parseDate(entries[currentIdx]?.date) ?? now;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const thMonthsFull = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const days = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  // year range: 5 years back to next year
  const yearList = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const headerLabel = `${thMonthsFull[viewMonth]} ${viewYear + 543}`;

  return (
    <Card>
      <div style={{ padding: '14px 16px' }}>

        {/* ── Month/Year nav header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={prevMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 4, display: 'flex', borderRadius: 8 }}>
            <ChevronLeft size={18} />
          </button>

          {/* clickable month + year */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Month picker trigger */}
            <button onClick={() => setPicking(p => p === 'month' ? null : 'month')}
              style={{
                background: picking === 'month' ? '#6366f1' : '#f1f5f9',
                color: picking === 'month' ? 'white' : '#1e293b',
                border: 'none', borderRadius: 8, padding: '4px 10px',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                fontFamily: 'Sarabun, sans-serif', transition: 'all .15s',
              }}>
              {thMonthsFull[viewMonth]}
            </button>
            {/* Year picker trigger */}
            <button onClick={() => setPicking(p => p === 'year' ? null : 'year')}
              style={{
                background: picking === 'year' ? '#6366f1' : '#f1f5f9',
                color: picking === 'year' ? 'white' : '#1e293b',
                border: 'none', borderRadius: 8, padding: '4px 10px',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                fontFamily: 'Sarabun, sans-serif', transition: 'all .15s',
              }}>
              {viewYear + 543}
            </button>
          </div>

          <button onClick={nextMonth}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 4, display: 'flex', borderRadius: 8 }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ── Month picker panel ── */}
        {picking === 'month' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12, padding: '10px 4px', background: '#f8fafc', borderRadius: 12 }}>
            {thMonths.map((m, i) => (
              <button key={m} onClick={() => { setViewMonth(i); setPicking(null); }}
                style={{
                  padding: '6px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600,
                  background: viewMonth === i ? '#6366f1' : 'white',
                  color: viewMonth === i ? 'white' : '#475569',
                  fontFamily: 'Sarabun, sans-serif', transition: 'all .12s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                {m}
              </button>
            ))}
          </div>
        )}

        {/* ── Year picker panel ── */}
        {picking === 'year' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12, padding: '10px 4px', background: '#f8fafc', borderRadius: 12 }}>
            {yearList.map(y => (
              <button key={y} onClick={() => { setViewYear(y); setPicking(null); }}
                style={{
                  padding: '6px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600,
                  background: viewYear === y ? '#6366f1' : 'white',
                  color: viewYear === y ? 'white' : '#475569',
                  fontFamily: 'Sarabun, sans-serif', transition: 'all .12s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                {y + 543}
              </button>
            ))}
          </div>
        )}

        {/* ── Weekday headers ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {days.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* ── Day grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const idx = dateMap.get(dateStr);
            const hasReport = idx !== undefined;
            const isSelected = idx === currentIdx;
            const isToday = dateStr === todayStr;

            return (
              <button key={day} onClick={() => hasReport ? onSelect(idx!) : undefined}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', borderRadius: '50%', border: 'none',
                  cursor: hasReport ? 'pointer' : 'default',
                  fontSize: '0.78rem', fontWeight: isSelected ? 800 : hasReport ? 600 : 400,
                  background: isSelected ? '#6366f1' : 'transparent',
                  color: isSelected ? 'white' : hasReport ? '#1e293b' : '#cbd5e1',
                  position: 'relative', transition: 'all .15s',
                }}>
                {day}
                {hasReport && !isSelected && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366f1', position: 'absolute', bottom: 3 }} />
                )}
                {isToday && !isSelected && (
                  <div style={{ position: 'absolute', inset: 0, border: '1.5px solid #6366f1', borderRadius: '50%', pointerEvents: 'none' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1' }} /> มีรายงาน
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #6366f1' }} /> วันนี้
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#6366f1' }} /> เลือกอยู่
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ───────────────────────────────── */
export default function ReportPage() {
  const [children, setChildren]         = useState<Child[]>([]);
  const [childLoading, setChildLoading] = useState(true);
  const [childId, setChildId]           = useState<string | null>(null);
  const [dayEntries, setDayEntries]     = useState<DayEntry[]>([]);
  const [dayIdx, setDayIdx]             = useState(0);
  const [daysLoading, setDaysLoading]   = useState(false);
  const [report, setReport]             = useState<DailyReport | null>(null);
  const [attendance, setAttendance]     = useState<Attendance | null>(null);
  const [scores, setScores]             = useState<BehaviorScore[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab]         = useState<'daily' | 'summary'>('daily');

  useEffect(() => {
    fetch('/api/report/children').then(r => r.json())
      .then(j => setChildren(j.data ?? []))
      .finally(() => setChildLoading(false));
  }, []);

  useEffect(() => {
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); setDayIdx(0); setReport(null); setAttendance(null); setScores([]);
    setActiveTab('daily');
    fetch(`/api/report/dates?child_id=${childId}`).then(r => r.json())
      .then(j => setDayEntries(j.data ?? []))
      .finally(() => setDaysLoading(false));
  }, [childId]);

  useEffect(() => {
    const entry = dayEntries[dayIdx];
    if (!entry || !childId) { setReport(null); setAttendance(null); setScores([]); return; }
    setReportLoading(true);
    Promise.all([
      entry.report_id
        ? fetch(`/api/daily-reports/${entry.report_id}`).then(r => r.json())
        : Promise.resolve({ data: null }),
      fetch(`/api/attendance?daily_id=${entry.daily_id}&child_id=${childId}`).then(r => r.json()),
      fetch(`/api/behavior-scores?daily_id=${entry.daily_id}&child_id=${childId}`).then(r => r.json()),
    ]).then(([rj, aj, bj]) => {
      setReport(rj.data ?? null);
      setAttendance((aj.data ?? [])[0] ?? null);
      setScores(bj.data ?? []);
    }).finally(() => setReportLoading(false));
  }, [dayIdx, dayEntries, childId]);

  const selectedChild = children.find(c => c.id === childId);
  const currentEntry  = dayEntries[dayIdx];
  const totalDays     = dayEntries.length;

  const Skeleton = ({ h = 80 }: { h?: number }) => (
    <div style={{ height: h, background: '#f1f5f9', borderRadius: 16, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
  );

  // group behavior scores by category
  const behaviorGroups = scores.reduce<Record<string, { name_th: string; name_en: string; items: BehaviorScore[] }>>((acc, s) => {
    if (!acc[s.category_id]) acc[s.category_id] = { name_th: s.category_name_th, name_en: s.category_name_en, items: [] };
    acc[s.category_id].items.push(s);
    return acc;
  }, {});

  // group excretions by action type
  const exDiaper = report?.excretions?.filter(e => e.action === 'diaper') ?? [];
  const exPotty  = report?.excretions?.filter(e => e.action === 'potty')  ?? [];
  const exDiaperPee = exDiaper.filter(e => e.type === 'pee');
  const exDiaperPoo = exDiaper.filter(e => e.type === 'poo');
  const exPottyPee  = exPotty.filter(e => e.type === 'pee');
  const exPottyPoo  = exPotty.filter(e => e.type === 'poo');

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fade { animation: fadeIn .25s ease; }
        * { box-sizing: border-box; }
        button { font-family: 'Sarabun', sans-serif; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 480, background: 'white', minHeight: '100vh', paddingBottom: 40, boxShadow: '0 0 30px rgba(0,0,0,0.06)' }}>

        {/* ── Header ── */}
        <div style={{ padding: '44px 20px 28px', textAlign: 'center', background: 'white' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
            <div style={{ position: 'absolute', inset: -8, border: '2px solid #f1f5f9', borderRadius: '50%' }} />
            {selectedChild?.photo_url ? (
              <img src={selectedChild.photo_url} alt={selectedChild.name_en ?? ''}
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.08)', position: 'relative' }} />
            ) : (
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.08)', position: 'relative', fontFamily: 'Prompt, sans-serif' }}>
                {selectedChild ? (selectedChild.name_en?.[0] ?? '🌻') : '🌻'}
              </div>
            )}
          </div>

          {selectedChild ? (
            <>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                น้อง{selectedChild.name_th}
                {selectedChild.name_en && <span style={{ color: '#6366f1', fontWeight: 400, fontSize: '1.1rem' }}> ({selectedChild.name_en})</span>}
              </h1>
              {currentEntry && (
                <div style={{ display: 'inline-block', marginTop: 10, padding: '6px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 100 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    📅 {thDate(currentEntry.date)}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Happy Kids</h1>
              <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#64748b' }}>รายงานรายวัน</p>
            </>
          )}

          {/* Home link */}
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <Link href="/" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 13 }}>
              <Home size={15} />
            </Link>
          </div>
        </div>

        <div style={{ padding: '0 16px', position: 'relative' }}>

          {/* ── Child selector ── */}
          <Card>
            <div style={{ padding: '13px 16px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>เลือกบุตรหลาน</p>
              {childLoading ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {[80, 90, 75].map((w, i) => <div key={i} style={{ height: 34, width: w, background: '#f1f5f9', borderRadius: 99, animation: 'pulse 1.5s infinite' }} />)}
                </div>
              ) : children.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>ยังไม่มีข้อมูลรายงาน</p>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {children.map(c => (
                    <button key={c.id} onClick={() => setChildId(c.id)}
                      style={{
                        padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                        fontSize: '0.88rem', fontWeight: childId === c.id ? 800 : 500,
                        background: childId === c.id ? '#6366f1' : '#f1f5f9',
                        color: childId === c.id ? 'white' : '#475569',
                        transition: 'all .15s',
                      }}>
                      {c.name_th}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* ── No child ── */}
          {!childId && !childLoading && children.length > 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <p style={{ fontSize: 44, marginBottom: 10 }}>👆</p>
              <p style={{ fontSize: '0.95rem' }}>เลือกชื่อบุตรหลานเพื่อดูรายงาน</p>
            </div>
          )}

          {/* ── Days loading ── */}
          {daysLoading && <><Skeleton h={280} /><Skeleton h={72} /></>}

          {/* ── No days ── */}
          {childId && !daysLoading && dayEntries.length === 0 && (
            <div style={{ background: 'white', borderRadius: 20, padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 38, marginBottom: 8 }}>📋</p>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>ยังไม่มีรายงานสำหรับ {selectedChild?.name_th}</p>
            </div>
          )}

          {!daysLoading && dayEntries.length > 0 && (
            <>
              {/* ── Calendar ── */}
              <CalendarStrip entries={dayEntries} currentIdx={dayIdx} onSelect={setDayIdx} />

              {/* ── Arrow navigator ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => setDayIdx(i => Math.min(i + 1, totalDays - 1))} disabled={dayIdx >= totalDays - 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: dayIdx < totalDays - 1 ? 'pointer' : 'default', background: '#f8fafc', color: dayIdx < totalDays - 1 ? '#6366f1' : '#cbd5e1', fontWeight: 600, fontSize: '0.82rem' }}>
                  <ChevronLeft size={15} /> วันก่อนหน้า
                </button>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {dayIdx === 0 ? '🟢 ล่าสุด' : `ย้อนหลัง ${dayIdx} วัน`}
                </span>
                <button onClick={() => setDayIdx(i => Math.max(i - 1, 0))} disabled={dayIdx <= 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: dayIdx > 0 ? 'pointer' : 'default', background: '#f8fafc', color: dayIdx > 0 ? '#6366f1' : '#cbd5e1', fontWeight: 600, fontSize: '0.82rem' }}>
                  วันถัดไป <ChevronRight size={15} />
                </button>
              </div>

              {/* ── Report loading (daily tab) ── */}
              {activeTab === 'daily' && reportLoading && <><Skeleton h={72} /><Skeleton h={180} /><Skeleton h={120} /><Skeleton h={160} /></>}

              {!reportLoading && activeTab === 'daily' && (
                <div className="fade">

                  {/* ── Attendance ── */}
                  {attendance ? (
                    <div style={{ background: attBg[attendance.status], borderRadius: 20, padding: '16px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${attC[attendance.status]}22` }}>
                      <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                        {attendance.status === 'present' ? '😊' : attendance.status === 'sick' ? '🤒' : attendance.status === 'absent' ? '😴' : '📝'}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: attC[attendance.status], fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>สถานะวันนี้</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: attC[attendance.status], margin: 0 }}>{attL[attendance.status]}</p>
                        {attendance.note && <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>{attendance.note}</p>}
                      </div>
                    </div>
                  ) : !report && (
                    <Card><div style={{ padding: '28px 18px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                      <p style={{ fontSize: 34, marginBottom: 8 }}>📋</p>ยังไม่มีรายงานสำหรับวันนี้
                    </div></Card>
                  )}

                  {report && (
                    <>
                      {/* ── Activity ── */}
                      {report.daily?.activity && (
                        <Card>
                          <CardHeader emoji="🎨" title="กิจกรรมวันนี้" color="#4338ca" />
                          <div style={{ padding: '16px 18px', fontSize: '1.08rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.5 }}>
                            {report.daily.activity}
                          </div>
                        </Card>
                      )}

                      {/* ── Food & Milk ── */}
                      <Card>
                        <CardHeader emoji="🥣" title="อาหารและโภชนาการ" color="#059669" />
                        <div style={{ padding: '16px 18px' }}>

                          {/* Food + Fruit grid */}
                          {(report.daily?.food || report.daily?.fruit) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                              {report.daily?.food && (
                                <div style={{ background: '#fdfdfd', border: '1px solid #edf2f7', padding: 14, borderRadius: 16, textAlign: 'center' }}>
                                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>มื้อกลางวัน</span>
                                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'block', marginBottom: 6 }}>{report.daily.food}</span>
                                  {report.food_amount && report.food_amount !== 'skip' && <StatusPill status={report.food_amount} />}
                                </div>
                              )}
                              {report.daily?.fruit && (
                                <div style={{ background: '#fdfdfd', border: '1px solid #edf2f7', padding: 14, borderRadius: 16, textAlign: 'center' }}>
                                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>ผลไม้</span>
                                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'block', marginBottom: 6 }}>{report.daily.fruit}</span>
                                  {report.fruit_amount && report.fruit_amount !== 'skip' && <StatusPill status={report.fruit_amount} />}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Milk */}
                          {(report.milk1 !== 'skip' || report.milk2 !== 'skip') && (
                            <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: 14 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4a5568', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                🥛 การดื่มนมประจำวัน
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                  { label: 'กล่องที่ 1 (เช้า)', val: report.milk1 },
                                  { label: 'กล่องที่ 2 (บ่าย)', val: report.milk2 },
                                ].map(m => {
                                  const s = amtStyle[m.val];
                                  const isSkip = m.val === 'skip';
                                  return (
                                    <div key={m.label} style={{ background: isSkip ? '#fff1f2' : '#f0f9ff', borderRadius: 12, border: `1px solid ${isSkip ? '#fecdd3' : '#bae6fd'}`, padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSkip ? '#9f1239' : '#0369a1' }}>{m.label}</span>
                                      <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 10, fontWeight: 700, background: s.bg, color: s.color }}>{amtL[m.val]}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* ── Behaviors ── */}
                      {scores.length > 0 && (
                        <Card>
                          <CardHeader emoji="✨" title="อุปนิสัยวันนี้" color="#7c3aed" />
                          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {Object.values(behaviorGroups).map(g => {
                              // categorize by score ratio
                              const excellent = g.items.filter(s => s.score >= s.max_score);
                              const good      = g.items.filter(s => s.score > 0 && s.score < s.max_score);
                              const improve   = g.items.filter(s => s.score === 0);

                              return (
                                <div key={g.name_th}>
                                  <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed', marginBottom: 10 }}>
                                    {g.name_th} <span style={{ color: '#c4b5fd', fontWeight: 400 }}>{g.name_en}</span>
                                  </p>
                                  {excellent.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: '#10b981' }}>
                                        <svg style={{ width: 20, height: 20 }} viewBox="0 0 100 100" fill="none">
                                          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="4"/>
                                          <path d="M28 38 Q34 28 40 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                                          <path d="M60 38 Q66 28 72 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                                          <path d="M28 58 Q50 82 72 58" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                                        </svg>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>ทำได้ดีเยี่ยม</span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
                                        {excellent.map(s => <span key={s.item_id} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #d1fae5', padding: '5px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600 }}>{s.name_th}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  {good.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: '#3b82f6' }}>
                                        <svg style={{ width: 20, height: 20 }} viewBox="0 0 100 100" fill="none">
                                          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="4"/>
                                          <circle cx="35" cy="38" r="4" fill="currentColor"/>
                                          <circle cx="65" cy="38" r="4" fill="currentColor"/>
                                          <path d="M35 58 Q50 72 65 58" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                                        </svg>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>ทำได้ดี</span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
                                        {good.map(s => <span key={s.item_id} style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe', padding: '5px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600 }}>{s.name_th}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  {improve.length > 0 && (
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: '#f59e0b' }}>
                                        <svg style={{ width: 20, height: 20 }} viewBox="0 0 100 100" fill="none">
                                          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="4"/>
                                          <circle cx="35" cy="38" r="4" fill="currentColor"/>
                                          <circle cx="65" cy="38" r="4" fill="currentColor"/>
                                          <line x1="35" y1="62" x2="65" y2="62" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                                        </svg>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>ควรส่งเสริม</span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
                                        {improve.map(s => <span key={s.item_id} style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7', padding: '5px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600 }}>{s.name_th}</span>)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      )}

                      {/* ── Nap ── */}
                      <Card>
                        <CardHeader emoji="😴" title="การนอนกลางวัน" color="#4338ca" />
                        <NapTimeline from={report.nap_from} to={report.nap_to} />
                      </Card>

                      {/* ── Excretions ── */}
                      {report.excretions && report.excretions.length > 0 && (
                        <Card>
                          <CardHeader emoji="🚽" title="การขับถ่าย (Toilet)" color="#059669" />
                          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* Diapers */}
                            {exDiaper.length > 0 && (
                              <div style={{ background: '#fff7ed', padding: 14, borderRadius: 18, border: '1px solid #ffedd5' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: '#c2410c' }}>
                                  <span style={{ fontSize: '1.1rem' }}>👶</span>
                                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>ผ้าอ้อม (Diapers)</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  {[
                                    { label: 'ฉี่ (Wet)',    items: exDiaperPee, color: '#9a3412' },
                                    { label: 'อึ (Soiled)',   items: exDiaperPoo, color: '#9a3412' },
                                  ].map(g => (
                                    g.items.length ? (
                                    <div key={g.label} style={{ background: 'white', padding: 10, borderRadius: 10, textAlign: 'center' }}>
                                      <span style={{ display: 'block', fontSize: '0.7rem', color: g.color, marginBottom: 3 }}>{g.label}</span>
                                      <span style={{ fontWeight: 700, color: '#4a5568' }}>{g.items.length} ครั้ง</span>
                                      <small style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>
                                        {g.items.map(e => e.time?.slice(0,5) ?? '').filter(Boolean).join(', ') || '-'}
                                      </small>
                                    </div>
                                    ):''
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Potty */}
                            {exPotty.length > 0 && (
                              <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 18, border: '1px solid #dcfce7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: '#15803d' }}>
                                  <span style={{ fontSize: '1.1rem' }}>🚽</span>
                                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>นั่งกระโถน (Potty)</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  {[
                                    { label: 'ฉี่ (Pee)',  items: exPottyPee, color: '#166534' },
                                    { label: 'อึ (Poo)',   items: exPottyPoo, color: '#166534' },
                                  ].map(g => (
                                    <div key={g.label} style={{ background: 'white', padding: 10, borderRadius: 10, textAlign: 'center' }}>
                                      <span style={{ display: 'block', fontSize: '0.7rem', color: g.color, marginBottom: 3 }}>{g.label}</span>
                                      <span style={{ fontWeight: 700, color: '#4a5568' }}>{g.items.length} ครั้ง</span>
                                      <small style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>
                                        {g.items.map(e => e.time?.slice(0,5) ?? '').filter(Boolean).join(', ') || '-'}
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* ── Teacher note ── */}
                      {report.note && (
                        <div style={{ background: '#eff6ff', borderRadius: 20, padding: '16px 18px', marginBottom: 14, border: '1px solid #dbeafe' }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>💬 ข้อความจากครู</p>
                          <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7, margin: 0 }}>{report.note}</p>
                        </div>
                      )}

                      {/* ── Footer ── */}
                      <div style={{ textAlign: 'center', padding: '16px 0 4px', borderTop: '1px solid #f1f5f9', marginTop: 6 }}>
                        <p style={{ margin: '2px 0', color: '#94a3b8', fontSize: '0.82rem' }}>บันทึกโดยคุณครู</p>
                        {/* <p style={{ margin: '2px 0', color: '#64748b', fontWeight: 700, fontSize: '0.88rem' }}>KinderCare</p> */}
                        {currentEntry && (
                          <p style={{ marginTop: 6, fontSize: '0.72rem', color: '#94a3b8' }}>
                            {thDate(currentEntry.date)}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
