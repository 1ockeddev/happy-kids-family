'use client';
import { useState, useEffect } from 'react';
import { useLiff } from '@/lib/useLiff';
import { Child, DailyReport, Attendance, MilkStatus, ExcretionType, ExcretionAction } from '@/types';

/* ─── reuse same label maps from report page ───── */
const amtL: Record<MilkStatus, string> = { all: 'ทานหมด', some: 'ทานครึ่ง', not_must: 'ไม่จำเป็น', skip: 'ไม่ทาน' };
const amtStyle: Record<MilkStatus, { bg: string; color: string }> = {
  all:      { bg: '#dcfce7', color: '#166534' },
  some:     { bg: '#fef9c3', color: '#854d0e' },
  not_must: { bg: '#dbeafe', color: '#1e40af' },
  skip:     { bg: '#ffe4e6', color: '#9f1239' },
};
const attBg: Record<string, string> = { present: '#ecfdf5', absent: '#fef2f2', sick: '#fffbeb', leave: '#eff6ff' };
const attC:  Record<string, string> = { present: '#10b981', absent: '#ef4444', sick: '#f59e0b', leave: '#3b82f6' };
const attL:  Record<string, string> = { present: '😊 มาเรียน', absent: '😴 ขาดเรียน', sick: '🤒 ป่วย', leave: '📝 ลา' };
const exTypeL: Record<ExcretionType,   string> = { pee: '💛 ปัสสาวะ', poo: '💩 อุจจาระ' };
const exActL:  Record<ExcretionAction, string> = { diaper: 'ผ้าอ้อม', potty: 'กระโถน' };

const parseDate = (d?: string | null) => {
  if (!d) return null;
  const s = d.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : null;
};
const thDate = (d?: string | null) =>
  parseDate(d)?.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? '';

interface DayEntry { date: string; daily_id: string; report_id: string | null; }
interface BehaviorScore {
  item_id: string; name_th: string; name_en: string;
  score: number; max_score: number;
  category_id: string; category_name_th: string; category_name_en: string;
}

const Pill = ({ status }: { status: MilkStatus }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, ...amtStyle[status] }}>
    {amtL[status]}
  </span>
);

const Skeleton = ({ h = 72 }: { h?: number }) => (
  <div style={{ height: h, background: '#f1f5f9', borderRadius: 16, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
);

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 14, overflow: 'hidden', ...style }}>
    {children}
  </div>
);

const CardHead = ({ emoji, title, color = '#4338ca' }: { emoji: string; title: string; color?: string }) => (
  <div style={{ background: '#f8fafc', padding: '12px 18px', borderBottom: `2px solid ${color}`, display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color }}>{title}</h2>
  </div>
);

export default function LiffPage() {
  const liff = useLiff();

  const [children, setChildren]     = useState<Child[]>([]);
  const [childId, setChildId]       = useState<string | null>(null);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [dayIdx, setDayIdx]         = useState(0);
  const [report, setReport]         = useState<DailyReport | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [scores, setScores]         = useState<BehaviorScore[]>([]);
  const [childLoading, setChildLoading] = useState(false);
  const [daysLoading, setDaysLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  // ── เมื่อ LIFF ready → register/upsert user แล้วดึงลูก ───────
  useEffect(() => {
    if (!liff.ready) return;
    if (!liff.profile?.userId) {
      // dev mode: fallback → ดึงทุกคนที่มี report
      fetch('/api/report/children').then(r => r.json()).then(j => setChildren(j.data ?? []));
      return;
    }
    setChildLoading(true);

    // step 1: register/upsert LINE user เข้า DB
    fetch('/api/auth/line-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_user_id: liff.profile.userId,
        display_name: liff.profile.displayName,
        picture_url:  liff.profile.pictureUrl ?? null,
      }),
    })
    // step 2: ดึงลูกที่ผูกกับ user นี้
    .then(() => fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`))
    .then(r => r.json())
    .then(j => {
      const kids = j.data ?? [];
      setChildren(kids);
      if (kids.length === 0) setNotRegistered(true);
      if (kids.length === 1) setChildId(kids[0].id);
    })
    .catch(() => setNotRegistered(true))
    .finally(() => setChildLoading(false));
  }, [liff.ready, liff.profile?.userId]);

  // ── เมื่อเลือกลูก → ดึงวันที่มีรายงาน ────────────────────
  useEffect(() => {
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); setDayIdx(0); setReport(null); setAttendance(null); setScores([]);
    fetch(`/api/report/dates?child_id=${childId}`).then(r => r.json())
      .then(j => setDayEntries(j.data ?? []))
      .finally(() => setDaysLoading(false));
  }, [childId]);

  // ── เมื่อเลือกวัน → ดึง report ────────────────────────────
  useEffect(() => {
    const entry = dayEntries[dayIdx];
    if (!entry || !childId) { setReport(null); setAttendance(null); setScores([]); return; }
    setReportLoading(true);
    Promise.all([
      entry.report_id ? fetch(`/api/daily-reports/${entry.report_id}`).then(r => r.json()) : Promise.resolve({ data: null }),
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

  const behaviorGroups = scores.reduce<Record<string, { name_th: string; items: BehaviorScore[] }>>((acc, s) => {
    if (!acc[s.category_id]) acc[s.category_id] = { name_th: s.category_name_th, items: [] };
    acc[s.category_id].items.push(s);
    return acc;
  }, {});

  const exDiaper = report?.excretions?.filter(e => e.action === 'diaper') ?? [];
  const exPotty  = report?.excretions?.filter(e => e.action === 'potty')  ?? [];

  /* ── LIFF loading ── */
  if (!liff.ready) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#f0f4f8' }}>
      <div style={{ width: 48, height: 48, border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>กำลังเข้าสู่ระบบ LINE...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (liff.error) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f0f4f8' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 320 }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
        <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>เกิดข้อผิดพลาด</p>
        <p style={{ fontSize: 13, color: '#64748b' }}>{liff.error}</p>
      </div>
    </div>
  );

  /* ── ผู้ปกครองที่ยังไม่ได้ผูกบัญชี ── */
  if (notRegistered && !childLoading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f0f4f8' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 320 }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>🏫</p>
        <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8, fontFamily: 'Prompt, sans-serif' }}>ยังไม่มีข้อมูล</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน<br />
          กรุณาติดต่อคุณครูเพื่อลงทะเบียน
        </p>
        {liff.profile && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 12, fontSize: 12, color: '#94a3b8' }}>
            LINE ID: {liff.profile.userId.slice(0, 12)}...
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100dvh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .fade{animation:fadeIn .25s ease}
        *{box-sizing:border-box}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: 'white', padding: '44px 20px 20px', textAlign: 'center', boxShadow: '0 1px 0 #f1f5f9' }}>
        {liff.profile?.pictureUrl ? (
          <img src={liff.profile.pictureUrl} alt=""
            style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 10, border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 10px' }}>🌻</div>
        )}
        {liff.profile && (
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>สวัสดี, {liff.profile.displayName}</p>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', fontFamily: 'Prompt, sans-serif', margin: 0 }}>Happy Kids</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>รายงานรายวันบุตรหลาน</p>
      </div>

      <div style={{ padding: '16px 16px 0', maxWidth: 520, margin: '0 auto' }}>

        {/* ── Child selector (ซ่อนถ้ามีลูกคนเดียว) ── */}
        {children.length > 1 && (
          <div style={{ background: 'white', borderRadius: 16, padding: '12px 14px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>เลือกบุตรหลาน</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {children.map(c => (
                <button key={c.id} onClick={() => setChildId(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', background: childId === c.id ? '#1e293b' : '#f1f5f9', color: childId === c.id ? 'white' : '#475569', fontWeight: childId === c.id ? 700 : 500, fontSize: 14, fontFamily: 'Sarabun, sans-serif', transition: 'all .15s' }}>
                  {c.photo_url
                    ? <img src={c.photo_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>{c.name_th?.slice(0, 1)}</div>
                  }
                  {c.name_th}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Child header ── */}
        {selectedChild && (
          <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {selectedChild.photo_url
              ? <img src={selectedChild.photo_url} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }} />
              : <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0 }}>{selectedChild.name_th?.slice(0, 1)}</div>
            }
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1e293b', fontFamily: 'Prompt, sans-serif' }}>{selectedChild.name_th}</h2>
              {selectedChild.name_en && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{selectedChild.name_en}</p>}
            </div>
          </div>
        )}

        {/* ── Loading states ── */}
        {childLoading && <><Skeleton /><Skeleton h={48} /></>}
        {daysLoading  && <><Skeleton h={80} /><Skeleton h={60} /></>}

        {/* ── No reports ── */}
        {childId && !daysLoading && dayEntries.length === 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📋</p>
            <p style={{ color: '#64748b', fontSize: 14 }}>ยังไม่มีรายงานสำหรับ {selectedChild?.name_th}</p>
          </div>
        )}

        {!daysLoading && dayEntries.length > 0 && (
          <>
            {/* ── Date strip ── */}
            <div style={{ background: 'white', borderRadius: 16, padding: '12px 14px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>เลือกวัน</p>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                {dayEntries.map((e, i) => {
                  const dt = parseDate(e.date);
                  const isToday = e.date === new Date().toISOString().slice(0, 10);
                  return (
                    <button key={e.daily_id} onClick={() => setDayIdx(i)}
                      style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', minWidth: 52, background: dayIdx === i ? '#6366f1' : '#f8fafc', color: dayIdx === i ? 'white' : '#475569', transition: 'all .15s' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7 }}>{dt?.toLocaleDateString('th-TH', { weekday: 'short' })}</span>
                      <span style={{ fontSize: 18, fontWeight: 800 }}>{dt?.getDate()}</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{dt?.toLocaleDateString('th-TH', { month: 'short' })}</span>
                      {isToday && dayIdx !== i && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366f1', marginTop: 2 }} />}
                    </button>
                  );
                })}
              </div>
              {currentEntry && (
                <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: '#1e293b', textAlign: 'center' }}>
                  📅 {thDate(currentEntry.date)}
                </p>
              )}
            </div>

            {/* ── Report loading ── */}
            {reportLoading && <><Skeleton h={70}/><Skeleton h={160}/><Skeleton h={110}/></>}

            {!reportLoading && (
              <div className="fade">

                {/* Attendance */}
                {attendance && (
                  <div style={{ background: attBg[attendance.status], borderRadius: 20, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${attC[attendance.status]}22` }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {attendance.status === 'present' ? '😊' : attendance.status === 'sick' ? '🤒' : attendance.status === 'absent' ? '😴' : '📝'}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: attC[attendance.status], fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>สถานะวันนี้</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: attC[attendance.status], margin: 0 }}>{attL[attendance.status]}</p>
                      {attendance.note && <p style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{attendance.note}</p>}
                    </div>
                  </div>
                )}

                {!report && !attendance && (
                  <Card><div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}><p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>ยังไม่มีรายงานวันนี้</div></Card>
                )}

                {report && (<>
                  {/* Activity */}
                  {report.daily?.activity && (
                    <Card>
                      <CardHead emoji="🎨" title="กิจกรรมวันนี้" color="#4338ca" />
                      <div style={{ padding: '14px 18px', fontSize: '1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.5 }}>{report.daily.activity}</div>
                    </Card>
                  )}

                  {/* Food & Milk */}
                  <Card>
                    <CardHead emoji="🥣" title="อาหารและโภชนาการ" color="#059669" />
                    <div style={{ padding: '14px 18px' }}>
                      {(report.daily?.food || report.daily?.fruit) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          {report.daily?.food && (
                            <div style={{ background: '#fdfdfd', border: '1px solid #edf2f7', padding: 12, borderRadius: 14, textAlign: 'center' }}>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>มื้อกลางวัน</span>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: 6 }}>{report.daily.food}</span>
                              {report.food_amount && report.food_amount !== 'skip' && <Pill status={report.food_amount} />}
                            </div>
                          )}
                          {report.daily?.fruit && (
                            <div style={{ background: '#fdfdfd', border: '1px solid #edf2f7', padding: 12, borderRadius: 14, textAlign: 'center' }}>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>ผลไม้</span>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', display: 'block', marginBottom: 6 }}>{report.daily.fruit}</span>
                              {report.fruit_amount && report.fruit_amount !== 'skip' && <Pill status={report.fruit_amount} />}
                            </div>
                          )}
                        </div>
                      )}
                      {(report.milk1 !== 'skip' || report.milk2 !== 'skip') && (
                        <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#4a5568', marginBottom: 8 }}>🥛 การดื่มนม</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[{ label: 'กล่องที่ 1 (เช้า)', val: report.milk1 }, { label: 'กล่องที่ 2 (บ่าย)', val: report.milk2 }].map(m => (
                              <div key={m.label} style={{ background: m.val === 'skip' ? '#fff1f2' : '#f0f9ff', borderRadius: 10, border: `1px solid ${m.val === 'skip' ? '#fecdd3' : '#bae6fd'}`, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: m.val === 'skip' ? '#9f1239' : '#0369a1' }}>{m.label}</span>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 700, ...amtStyle[m.val] }}>{amtL[m.val]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Behaviors */}
                  {scores.length > 0 && (
                    <Card>
                      <CardHead emoji="✨" title="อุปนิสัยวันนี้" color="#7c3aed" />
                      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {Object.values(behaviorGroups).map(g => {
                          const excellent = g.items.filter(s => s.score >= s.max_score);
                          const good      = g.items.filter(s => s.score > 0 && s.score < s.max_score);
                          const improve   = g.items.filter(s => s.score === 0);
                          return (
                            <div key={g.name_th}>
                              <p style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', marginBottom: 8 }}>{g.name_th}</p>
                              {[
                                { items: excellent, label: 'ทำได้ดีเยี่ยม', tagStyle: { bg: '#ecfdf5', color: '#065f46', border: '#d1fae5' } },
                                { items: good,      label: 'ทำได้ดี',       tagStyle: { bg: '#eff6ff', color: '#1e40af', border: '#dbeafe' } },
                                { items: improve,   label: 'ควรส่งเสริม',   tagStyle: { bg: '#fffbeb', color: '#92400e', border: '#fef3c7' } },
                              ].filter(g => g.items.length > 0).map(({ items, label, tagStyle }) => (
                                <div key={label} style={{ marginBottom: 8 }}>
                                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5 }}>{label}</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {items.map(s => (
                                      <span key={s.item_id} style={{ background: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}`, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{s.name_th}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Nap */}
                  <Card>
                    <CardHead emoji="😴" title="การนอนกลางวัน" color="#4338ca" />
                    <div style={{ padding: '14px 18px' }}>
                      {report.nap_from && report.nap_to ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: 36 }}>💤</div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 18, color: '#1e1b4b', margin: 0 }}>
                              {report.nap_from.slice(0, 5)} – {report.nap_to.slice(0, 5)} น.
                            </p>
                            <p style={{ fontSize: 12, color: '#818cf8', margin: '2px 0 0' }}>
                              {(() => { const d = (new Date(`2000-01-01T${report.nap_to}`) .getTime() - new Date(`2000-01-01T${report.nap_from}`).getTime()) / 60000; return `${Math.floor(d/60)} ชม. ${d%60} นาที`; })()}
                            </p>
                          </div>
                        </div>
                      ) : <p style={{ color: '#94a3b8', fontSize: 14 }}>ไม่ได้นอนกลางวัน</p>}
                    </div>
                  </Card>

                  {/* Excretions */}
                  {(exDiaper.length > 0 || exPotty.length > 0) && (
                    <Card>
                      <CardHead emoji="🚽" title="การขับถ่าย" color="#059669" />
                      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {exDiaper.length > 0 && (
                          <div style={{ background: '#fff7ed', padding: 12, borderRadius: 14, border: '1px solid #ffedd5' }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#c2410c', marginBottom: 8 }}>👶 ผ้าอ้อม</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {[{ label: 'ฉี่', items: exDiaper.filter(e => e.type === 'pee') }, { label: 'อึ', items: exDiaper.filter(e => e.type === 'poo') }].map(g => (
                                <div key={g.label} style={{ background: 'white', padding: 8, borderRadius: 10, textAlign: 'center' }}>
                                  <span style={{ display: 'block', fontSize: 11, color: '#9a3412' }}>{g.label}</span>
                                  <span style={{ fontWeight: 700 }}>{g.items.length} ครั้ง</span>
                                  <small style={{ display: 'block', fontSize: 10, color: '#94a3b8' }}>{g.items.map(e => e.time?.slice(0,5)).filter(Boolean).join(', ') || '-'}</small>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {exPotty.length > 0 && (
                          <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 14, border: '1px solid #dcfce7' }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#15803d', marginBottom: 8 }}>🚽 กระโถน</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {[{ label: 'ฉี่', items: exPotty.filter(e => e.type === 'pee') }, { label: 'อึ', items: exPotty.filter(e => e.type === 'poo') }].map(g => (
                                <div key={g.label} style={{ background: 'white', padding: 8, borderRadius: 10, textAlign: 'center' }}>
                                  <span style={{ display: 'block', fontSize: 11, color: '#166534' }}>{g.label}</span>
                                  <span style={{ fontWeight: 700 }}>{g.items.length} ครั้ง</span>
                                  <small style={{ display: 'block', fontSize: 10, color: '#94a3b8' }}>{g.items.map(e => e.time?.slice(0,5)).filter(Boolean).join(', ') || '-'}</small>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {[...exDiaper, ...exPotty].filter(Boolean).length === 0 && (
                          <p style={{ color: '#94a3b8', fontSize: 14 }}>-</p>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Note */}
                  {report.note && (
                    <div style={{ background: '#eff6ff', borderRadius: 20, padding: '14px 18px', marginBottom: 14, border: '1px solid #dbeafe' }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>💬 ข้อความจากครู</p>
                      <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, margin: 0 }}>{report.note}</p>
                    </div>
                  )}
                </>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
