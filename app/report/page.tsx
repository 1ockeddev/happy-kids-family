'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Child, DailyReport, Attendance, MilkStatus, ExcretionType, ExcretionAction } from '@/types';
import BehaviorSummary from '@/components/report/BehaviorSummary';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── label maps ─────────────────────────────── */
const amtL: Record<MilkStatus, string> = { all: 'ทานหมด', some: 'ทานครึ่งเดียว', not_must: 'ไม่จำเป็น', skip: 'ไม่ทาน' };
const amtStyle: Record<MilkStatus, { bg: string; color: string }> = {
  all:      { bg: '#dcfce7', color: '#15803d' },
  some:     { bg: '#fef3c7', color: '#b45309' },
  not_must: { bg: '#dbeafe', color: '#1e40af' },
  skip:     { bg: '#ffe4e6', color: '#9f1239' },
};
const attL: Record<string, string>  = { present: '😊 มาเรียน', absent: '😴 ขาดเรียน', sick: '🤒 ป่วย', leave: '📝 ลา' };
const attC: Record<string, string>  = { present: '#10b981', absent: '#ef4444', sick: '#f59e0b', leave: '#3b82f6' };
const attBg: Record<string, string> = { present: '#ecfdf5', absent: '#fef2f2', sick: '#fffbeb', leave: '#eff6ff' };
const habitTier = [
  { key: 'excellent', label: 'ทำได้ดีเยี่ยม', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', textColor: '#166534', face: 'happy' },
  { key: 'good',      label: 'ทำได้ดี',       color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', textColor: '#1e40af', face: 'smile' },
  { key: 'improve',   label: 'ควรส่งเสริม',   color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7', textColor: '#92400e', face: 'neutral' },
];

interface BehaviorScore {
  item_id: string; score: number; max_score: number;
  name_th: string; name_en: string; note?: string | null;
  category_id: string; category_name_th: string;
}
interface DayEntry { date: string; daily_id: string; report_id: string | null; }

/* ─── helpers ──────────────────────────────────── */
const parseDate = (d?: string | null): Date | null => {
  if (!d) return null;
  const s = d.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : null;
};
const thDate = (d?: string | null) =>
  parseDate(d)?.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? '';

/* ─── SVG face icons ────────────────────────────── */
const FaceHappy = ({ color, size = 22 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <path d="M28 38 Q34 28 40 38" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path d="M60 38 Q66 28 72 38" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 58 Q50 82 72 58" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceSmile = ({ color, size = 22 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <circle cx="35" cy="38" r="4" fill={color}/>
    <circle cx="65" cy="38" r="4" fill={color}/>
    <path d="M35 58 Q50 72 65 58" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceNeutral = ({ color, size = 22 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <circle cx="35" cy="38" r="4" fill={color}/>
    <circle cx="65" cy="38" r="4" fill={color}/>
    <line x1="35" y1="62" x2="65" y2="62" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceIcon = ({ type, color, size }: { type: string; color: string; size?: number }) => {
  if (type === 'happy')   return <FaceHappy color={color} size={size} />;
  if (type === 'smile')   return <FaceSmile color={color} size={size} />;
  return <FaceNeutral color={color} size={size} />;
};

/* ─── Shimmer Skeleton ────────────────────────── */
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 8,
};
const SkRow = ({ w='100%', h=14, r=8, mb=0 }: { w?: string|number; h?: number; r?: number; mb?: number }) =>
  <div style={{ ...shimmerStyle, width: w, height: h, borderRadius: r, marginBottom: mb }} />;
const SkCircle = ({ size=40 }: { size?: number }) =>
  <div style={{ ...shimmerStyle, width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />;
const SkCard = ({ children, p=18 }: { children: React.ReactNode; p?: number }) => (
  <div style={{ background:'white', borderRadius:16, border:'1px solid #e2e8f0', marginBottom:14, padding:p, overflow:'hidden' }}>{children}</div>
);
const SkHeader = () => (
  <div style={{ padding:'30px 24px 20px', background:'white', borderBottom:'1px solid #f1f5f9' }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
      <div style={{ display:'flex', gap:10 }}>
        {[1,2].map(i => <SkCircle key={i} size={42} />)}
      </div>
      <div style={{ display:'flex', gap:10 }}>
        {[1,2,3,4].map(i => <SkCircle key={i} size={42} />)}
      </div>
    </div>
    <SkRow w={100} h={12} mb={8} r={6} />
    <SkRow w={160} h={22} r={6} mb={6} />
    <SkRow w={140} h={12} r={6} />
  </div>
);
const SkDateStrip = () => (
  <SkCard p={14}>
    <div style={{ display:'flex', gap:6 }}>
      {[1,2,3,4,5].map(i => <div key={i} style={{ ...shimmerStyle, width:52, height:68, borderRadius:12, flexShrink:0 }} />)}
    </div>
  </SkCard>
);
const SkContent = () => (<>
  <div style={{ height:72, background:'#f8fafc', borderRadius:16, border:'1px solid #e2e8f0', marginBottom:14, padding:'20px', display:'flex', flexDirection:'column', gap:8 }}>
    <SkRow w={80} h={10} r={4} />
    <SkRow w={180} h={20} r={6} />
  </div>
  <SkCard p={20}>
    <SkRow w={120} h={14} mb={12} />
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
      {[1,2].map(i => <div key={i} style={{ background:'#f8fafc', borderRadius:12, padding:12, display:'flex', flexDirection:'column', gap:8 }}>
        <SkRow w={60} h={10} /><SkRow w={'80%'} h={14} r={6} /><SkRow w={50} h={20} r={99} />
      </div>)}
    </div>
    <SkRow h={38} r={10} mb={8} /><SkRow h={38} r={10} />
  </SkCard>
  <SkCard p={20}>
    <SkRow w={120} h={14} mb={16} />
    {[1,2].map(i => <div key={i} style={{ marginBottom:12 }}>
      <SkRow w={80} h={12} mb={8} />
      <div style={{ display:'flex', gap:6 }}>{[70,90,60].map((w,j) => <SkRow key={j} w={w} h={28} r={8} />)}</div>
    </div>)}
  </SkCard>
</>);

/* ─── NapTimeline ───────────────────────────────── */
function NapTimeline({ from, to }: { from: string|null; to: string|null }) {
  if (!from || !to) return (
    <div style={{ padding:'14px 20px', color:'#94a3b8', fontSize:'0.9rem', textAlign:'center' }}>ไม่ได้นอนกลางวัน</div>
  );
  const toMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  const start=9*60, end=15*60, total=end-start;
  const napStart=toMin(from), napEnd=toMin(to);
  const left=((napStart-start)/total)*100, width=((napEnd-napStart)/total)*100;
  const dur=napEnd-napStart;
  const durStr = dur>=60 ? `${Math.floor(dur/60)} ชม. ${dur%60>0?`${dur%60} นาที`:''}` : `${dur} นาที`;
  return (
    <div style={{ padding:'14px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#1e1b4b' }}>{durStr}</span>
        <span style={{ fontSize:'0.75rem', color:'#818cf8', fontWeight:700 }}>{from.slice(0,5)} - {to.slice(0,5)} น.</span>
      </div>
      <div style={{ position:'relative', paddingTop:16 }}>
        <div style={{ position:'absolute', top:0, width:'100%', fontSize:'0.65rem', color:'#94a3b8', fontWeight:700 }}>
          <span style={{ position:'absolute', left:0 }}>09:00</span>
          <span style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>12:00</span>
          <span style={{ position:'absolute', right:0 }}>15:00</span>
        </div>
        <div style={{ width:'100%', height:10, background:'#f1f5f9', borderRadius:5, overflow:'hidden', margin:'5px 0', position:'relative' }}>
          <div style={{ position:'absolute', left:`${left}%`, width:`${width}%`, height:'100%', background:'#818cf8', borderRadius:5 }} />
        </div>
        <div style={{ position:'relative', height:14, fontSize:'0.65rem', fontWeight:700, color:'#4338ca' }}>
          <span style={{ position:'absolute', left:`${left}%`, transform:'translateX(-50%)' }}>{from.slice(0,5)}</span>
          <span style={{ position:'absolute', left:`${left+width}%`, transform:'translateX(-50%)' }}>{to.slice(0,5)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── CalendarStrip ─────────────────────────────── */
function CalendarStrip({ entries, currentIdx, onSelect }: {
  entries: DayEntry[]; currentIdx: number; onSelect: (i: number) => void;
}) {
  if (!entries.length) return null;
  const dateMap = new Map(entries.map((e,i) => [e.date, i]));
  const dates   = entries.map(e => e.date).sort();
  const minDate = parseDate(dates[0]) ?? new Date();
  const maxDate = parseDate(dates[dates.length-1]) ?? new Date();
  const prevEntriesRef = React.useRef(entries);

  const [viewYear,  setViewYear]  = useState(() => { const d=parseDate(entries[currentIdx]?.date)??new Date(); return d.getFullYear(); });
  const [viewMonth, setViewMonth] = useState(() => { const d=parseDate(entries[currentIdx]?.date)??new Date(); return d.getMonth(); });

  useEffect(() => {
    if (prevEntriesRef.current !== entries) {
      prevEntriesRef.current = entries;
      const d = parseDate(entries[currentIdx]?.date) ?? new Date();
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
    }
  }, [entries, currentIdx]);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const monthLabel  = new Date(viewYear, viewMonth, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const canPrev     = new Date(viewYear, viewMonth, 1) > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canNext     = new Date(viewYear, viewMonth+1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 1);
  const days        = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  return (
    <div style={{ background:'white', borderRadius:16, border:'1px solid #e2e8f0', marginBottom:12, overflow:'hidden' }}>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <button onClick={() => { if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); }}
            disabled={!canPrev} style={{ background:'none', border:'none', cursor:canPrev?'pointer':'default', color:canPrev?'#6366f1':'#e2e8f0', padding:4, display:'flex' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e293b' }}>{monthLabel}</span>
          <button onClick={() => { if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); }}
            disabled={!canNext} style={{ background:'none', border:'none', cursor:canNext?'pointer':'default', color:canNext?'#6366f1':'#e2e8f0', padding:4, display:'flex' }}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
          {days.map(d => <div key={d} style={{ textAlign:'center', fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', padding:'2px 0' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {Array.from({ length:firstDay }, (_,i) => <div key={`e${i}`} />)}
          {Array.from({ length:daysInMonth }, (_,i) => {
            const day = i+1;
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const idx     = dateMap.get(dateStr);
            const hasReport  = idx !== undefined;
            const isSelected = idx === currentIdx;
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            return (
              <button key={day} onClick={() => hasReport ? onSelect(idx!) : undefined}
                style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:'50%', border:'none', cursor:hasReport?'pointer':'default', fontSize:'0.78rem', fontWeight:isSelected?800:hasReport?600:400, background:isSelected?'#6366f1':'transparent', color:isSelected?'white':hasReport?'#1e293b':'#cbd5e1', position:'relative', transition:'all .15s' }}>
                {day}
                {hasReport && !isSelected && <div style={{ width:4, height:4, borderRadius:'50%', background:'#6366f1', position:'absolute', bottom:2 }} />}
                {isToday && !isSelected && <div style={{ position:'absolute', inset:0, border:'1.5px solid #6366f1', borderRadius:'50%', pointerEvents:'none' }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:12, marginTop:8, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
          <span style={{ fontSize:'0.65rem', color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'#6366f1' }} /> มีรายงาน
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────── */
function AvatarCircle({ child, size=42, active=false, accent='#6366f1' }: { child: Child; size?: number; active?: boolean; accent?: string }) {
  const initials = (child.name_th ?? child.name_en ?? '?').slice(0,1);
  const colors   = ['#6366f1','#f472b6','#10b981','#f59e0b','#3b82f6','#e85c5c'];
  const bg       = colors[(child.name_th?.charCodeAt(0) ?? 0) % colors.length];
  return child.photo_url ? (
    <img src={child.photo_url} alt={child.name_th ?? ''}
      style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', opacity:active?1:0.35, border:`1.5px solid ${active?accent:'#e2e8f0'}`, transition:'all .2s', flexShrink:0 }} />
  ) : (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:size*0.38, fontWeight:700, opacity:active?1:0.35, border:`1.5px solid ${active?accent:'#e2e8f0'}`, transition:'all .2s', flexShrink:0 }}>
      {initials}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────── */
export default function ReportPage() {
  const [children,      setChildren]      = useState<Child[]>([]);
  const [childId,       setChildId]       = useState<string|null>(null);
  const [dayEntries,    setDayEntries]    = useState<DayEntry[]>([]);
  const [dayIdx,        setDayIdx]        = useState(0);
  const [report,        setReport]        = useState<DailyReport|null>(null);
  const [attendance,    setAttendance]    = useState<Attendance|null>(null);
  const [scores,        setScores]        = useState<BehaviorScore[]>([]);
  const [childLoading,  setChildLoading]  = useState(true);
  const [daysLoading,   setDaysLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab,     setActiveTab]     = useState<'daily'|'summary'>('daily');

  useEffect(() => {
    fetch('/api/report/children').then(r=>r.json())
      .then(j => setChildren(j.data??[]))
      .finally(() => setChildLoading(false));
  }, []);

  useEffect(() => {
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); setDayIdx(0); setReport(null); setAttendance(null); setScores([]); setActiveTab('daily');
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(j => setDayEntries(j.data??[]))
      .finally(() => setDaysLoading(false));
  }, [childId]);

  useEffect(() => {
    const entry = dayEntries[dayIdx];
    if (!entry || !childId) { setReport(null); setAttendance(null); setScores([]); return; }
    setReportLoading(true);
    Promise.all([
      entry.report_id ? fetch(`/api/daily-reports/${entry.report_id}`).then(r=>r.json()) : Promise.resolve({data:null}),
      fetch(`/api/attendance?daily_id=${entry.daily_id}&child_id=${childId}`).then(r=>r.json()),
      fetch(`/api/behavior-scores?daily_id=${entry.daily_id}&child_id=${childId}`).then(r=>r.json()),
    ]).then(([rj,aj,bj]) => {
      setReport(rj.data??null);
      setAttendance((aj.data??[])[0]??null);
      setScores(bj.data??[]);
    }).finally(() => setReportLoading(false));
  }, [dayIdx, dayEntries, childId]);

  const selectedChild = children.find(c => c.id === childId);
  const currentEntry  = dayEntries[dayIdx];
  const totalDays     = dayEntries.length;

  // behavior groups
  const behaviorGroups = scores.reduce<Record<string,{name_th:string;items:BehaviorScore[]}>>((acc,s) => {
    if (!acc[s.category_id]) acc[s.category_id] = { name_th:s.category_name_th, items:[] };
    acc[s.category_id].items.push(s);
    return acc;
  }, {});

  const exDiaper = report?.excretions?.filter(e=>e.action==='diaper')??[];
  const exPotty  = report?.excretions?.filter(e=>e.action==='potty')??[];

  return (
    <div style={{ background:'#f8fafc', minHeight:'100dvh', display:'flex', justifyContent:'center' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .fade{animation:fadeIn .25s ease}
        *{box-sizing:border-box}
        button{font-family:'Sarabun',sans-serif}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <div style={{ width:'100%', maxWidth:480, background:'white', minHeight:'100dvh', paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 24px)', boxShadow:'0 0 40px rgba(0,0,0,0.03)' }}>

        {/* ── HEADER ── */}
        {childLoading ? <SkHeader /> : (
          <header style={{ padding:'30px 24px 20px', background:'white', borderBottom:'1px solid #f1f5f9' }}>
            {/* Two-way selector */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:12 }}>

              {/* Children side (right → RTL scroll) */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1, overflow:'hidden', alignItems:'flex-end' }}>
                <span style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:1, color:'#94a3b8', fontWeight:800 }}>ลูก / หลาน</span>
                <div className="scrollbar-none" style={{ display:'flex', gap:10, overflowX:'auto', direction:'rtl', width:'100%' }}>
                  {children.map(c => (
                    <button key={c.id} type="button" onClick={() => setChildId(c.id)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', padding:0, cursor:'pointer', flexShrink:0, direction:'ltr' }}>
                      <AvatarCircle child={c} active={childId===c.id} accent="#6366f1" />
                      <div style={{ width:4, height:4, borderRadius:'50%', background:childId===c.id?'#6366f1':'transparent', transition:'all .2s' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Heart connector */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'#fb7185', fontSize:'1.1rem', padding:'0 8px', alignSelf:'center', marginTop:16, flexShrink:0 }}>
                <i className="bi bi-heart-fill" style={{color:'#ff8787'}}></i>
              </div>

              {/* Parent placeholder — future feature */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1, overflow:'hidden', alignItems:'flex-start' }}>
                <span style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:1, color:'#94a3b8', fontWeight:800 }}>ผู้ปกครอง</span>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'#f1f5f9', border:'1.5px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, opacity:0.5 }}>👤</div>
              </div>
            </div>

            {/* Name + Date */}
            <div>
              <p style={{ margin:0, fontSize:'0.8rem', fontWeight:600, color:'#6366f1', minHeight:18 }}>
                {selectedChild ? `น้อง${selectedChild.name_th ?? selectedChild.name_en ?? ''}` : ''}
              </p>
              <h1 style={{ margin:'2px 0 0', fontSize:'1.25rem', fontWeight:700, color:'#0f172a', letterSpacing:-0.3 }}>
                {selectedChild?.name_th ?? selectedChild?.name_en ?? 'Happy Kids'}
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>
                {currentEntry ? thDate(currentEntry.date) : new Date().toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
          </header>
        )}

        {/* ── No child selected ── */}
        {!childLoading && !childId && children.length > 0 && (
          <div style={{ textAlign:'center', padding:'56px 20px', color:'#94a3b8' }}>
            <p style={{ fontSize:44, marginBottom:10 }}>👆</p>
            <p style={{ fontSize:'0.95rem' }}>เลือกบุตรหลานด้านบนเพื่อดูรายงาน</p>
          </div>
        )}
        {!childLoading && children.length === 0 && (
          <div style={{ textAlign:'center', padding:'56px 20px', color:'#94a3b8' }}>
            <p style={{ fontSize:40, marginBottom:10 }}>📋</p>
            <p style={{ fontSize:'0.95rem' }}>ยังไม่มีข้อมูลรายงาน</p>
          </div>
        )}

        {childId && (
          <div style={{ padding:'16px 16px 0' }}>

            {/* Days loading */}
            {daysLoading && <><SkDateStrip /><SkContent /></>}

            {!daysLoading && dayEntries.length === 0 && (
              <div style={{ background:'white', borderRadius:16, padding:'40px 20px', textAlign:'center', border:'1px solid #e2e8f0' }}>
                <p style={{ fontSize:36, marginBottom:8 }}>📋</p>
                <p style={{ color:'#64748b', fontSize:'0.95rem' }}>ยังไม่มีรายงานสำหรับ {selectedChild?.name_th}</p>
              </div>
            )}

            {!daysLoading && dayEntries.length > 0 && (<>
              {/* Calendar */}
              <CalendarStrip entries={dayEntries} currentIdx={dayIdx} onSelect={setDayIdx} />

              {/* Arrow nav */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <button onClick={() => setDayIdx(i=>Math.min(i+1,totalDays-1))} disabled={dayIdx>=totalDays-1}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:99, border:'none', cursor:dayIdx<totalDays-1?'pointer':'default', background:'#f8fafc', color:dayIdx<totalDays-1?'#6366f1':'#cbd5e1', fontWeight:600, fontSize:'0.8rem' }}>
                  <ChevronLeft size={14} /> ก่อนหน้า
                </button>
                <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                  {dayIdx===0?'🟢 ล่าสุด':`ย้อนหลัง ${dayIdx} วัน`}
                </span>
                <button onClick={() => setDayIdx(i=>Math.max(i-1,0))} disabled={dayIdx<=0}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:99, border:'none', cursor:dayIdx>0?'pointer':'default', background:'#f8fafc', color:dayIdx>0?'#6366f1':'#cbd5e1', fontWeight:600, fontSize:'0.8rem' }}>
                  ถัดไป <ChevronRight size={14} />
                </button>
              </div>

              {/* Tab bar */}
              <div style={{ display:'flex', background:'white', borderRadius:14, padding:4, marginBottom:14, border:'1px solid #e2e8f0', gap:4 }}>
                {[{ key:'daily', label:'📋 รายวัน' },{ key:'summary', label:'📊 สรุปอุปนิสัย' }].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as 'daily'|'summary')}
                    style={{ flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:'0.82rem', fontWeight:activeTab===tab.key?800:500, background:activeTab===tab.key?'#6366f1':'transparent', color:activeTab===tab.key?'white':'#64748b', transition:'all .15s' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Summary tab */}
              {activeTab==='summary' && childId && <BehaviorSummary childId={childId} />}

              {/* Report loading */}
              {activeTab==='daily' && reportLoading && <SkContent />}

              {activeTab==='daily' && !reportLoading && (
                <div className="fade">

                  {/* Attendance */}
                  {attendance && (
                    <div style={{ background:attBg[attendance.status], borderRadius:16, padding:'13px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:12, border:`1px solid ${attC[attendance.status]}22` }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                        {attendance.status==='present'?'😊':attendance.status==='sick'?'🤒':attendance.status==='absent'?'😴':'📝'}
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:attC[attendance.status], fontWeight:800, margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.08em' }}>สถานะวันนี้</p>
                        <p style={{ fontSize:'1.1rem', fontWeight:800, color:attC[attendance.status], margin:0 }}>{attL[attendance.status]}</p>
                        {attendance.note && <p style={{ fontSize:'0.8rem', color:'#475569', margin:'3px 0 0' }}>{attendance.note}</p>}
                      </div>
                    </div>
                  )}

                  {!report && !attendance && (
                    <div style={{ background:'white', borderRadius:16, padding:'36px 20px', textAlign:'center', border:'1px solid #e2e8f0', marginBottom:14 }}>
                      <p style={{ fontSize:36, marginBottom:8 }}>📋</p>
                      <p style={{ color:'#64748b', fontSize:'0.9rem' }}>ยังไม่มีรายงานสำหรับวันนี้</p>
                    </div>
                  )}

                  {report && (<>

                    {/* Activity */}
                    {report.daily?.activity && (
                      <div style={{ background:'white', borderRadius:16, padding:'22px 20px', marginBottom:14, border:'1px solid #e2e8f0', textAlign:'center' }}>
                        <span style={{ fontSize:'0.65rem', fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:1.5, display:'block', marginBottom:6 }}>TODAY&apos;S ACTIVITY</span>
                        <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:700, color:'#0f172a', letterSpacing:-0.2 }}>{report.daily.activity}</h2>
                      </div>
                    )}

                    {/* Food & Milk */}
                    <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:14, border:'1px solid #e2e8f0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:'1rem', marginBottom:16, color:'#334155' }}>
                        <span style={{ fontSize:'1.15rem' }}>🥣</span> อาหารและโภชนาการ
                      </div>
                      {/* Food / Fruit grid */}
                      {(report.daily?.food || report.daily?.fruit) && (
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                          {report.daily?.food && (
                            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', padding:12, borderRadius:12, display:'flex', flexDirection:'column' }}>
                              <span style={{ fontSize:'0.7rem', color:'#64748b', display:'block', marginBottom:4, fontWeight:500 }}>มื้อกลางวัน</span>
                              <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#0f172a', flex:1 }}>{report.daily.food}</span>
                              {report.food_amount && report.food_amount!=='skip' && (
                                <span style={{ display:'inline-block', marginTop:8, padding:'2px 8px', borderRadius:6, fontSize:'0.65rem', fontWeight:700, alignSelf:'flex-start', background:amtStyle[report.food_amount].bg, color:amtStyle[report.food_amount].color }}>
                                  {amtL[report.food_amount]}
                                </span>
                              )}
                              {report.food_note && (
                                <div style={{ marginTop:8, fontSize:'0.7rem', color:'#64748b', lineHeight:1.4, borderTop:'1px solid #e2e8f0', paddingTop:6 }}>
                                  💬 {report.food_note}
                                </div>
                              )}
                            </div>
                          )}
                          {report.daily?.fruit && (
                            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', padding:12, borderRadius:12, display:'flex', flexDirection:'column' }}>
                              <span style={{ fontSize:'0.7rem', color:'#64748b', display:'block', marginBottom:4, fontWeight:500 }}>ผลไม้</span>
                              <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#0f172a', flex:1 }}>{report.daily.fruit}</span>
                              {report.fruit_amount && report.fruit_amount!=='skip' && (
                                <span style={{ display:'inline-block', marginTop:8, padding:'2px 8px', borderRadius:6, fontSize:'0.65rem', fontWeight:700, alignSelf:'flex-start', background:amtStyle[report.fruit_amount].bg, color:amtStyle[report.fruit_amount].color }}>
                                  {amtL[report.fruit_amount]}
                                </span>
                              )}
                              {report.fruit_note && (
                                <div style={{ marginTop:8, fontSize:'0.7rem', color:'#64748b', lineHeight:1.4, borderTop:'1px solid #e2e8f0', paddingTop:6 }}>
                                  💬 {report.fruit_note}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Milk */}
                      {(report.milk1!=='skip' || report.milk2!=='skip') && (
                        <div style={{ borderTop:'1px dashed #e2e8f0', paddingTop:14 }}>
                          <h3 style={{ fontSize:'0.82rem', fontWeight:700, color:'#4a5568', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                            🥛 การดื่มนมประจำวัน
                          </h3>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {[
                              { label:'กล่องที่ 1 (เช้า)', val:report.milk1, note:report.milk1_note },
                              { label:'กล่องที่ 2 (บ่าย)',  val:report.milk2, note:report.milk2_note },
                            ].map(m => {
                              const isSkip = m.val==='skip';
                              return (
                                <div key={m.label} style={{ background:isSkip?'#fff1f2':'#f0f9ff', borderRadius:12, border:`1px solid ${isSkip?'#fecdd3':'#bae6fd'}`, padding:'10px 14px' }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span style={{ fontSize:'0.85rem', fontWeight:700, color:isSkip?'#9f1239':'#0369a1' }}>{m.label}</span>
                                    <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:6, fontWeight:700, background:amtStyle[m.val].bg, color:amtStyle[m.val].color }}>{amtL[m.val]}</span>
                                  </div>
                                  {m.note && (
                                    <div style={{ marginTop:8, fontSize:'0.72rem', color:isSkip?'#be123c':'#0369a1', background:'white', padding:'5px 10px', borderRadius:8, border:`1px dashed ${isSkip?'#fb7185':'#7dd3fc'}` }}>
                                      <strong>หมายเหตุ:</strong> {m.note}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Behaviors */}
                    {scores.length > 0 && (
                      <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:14, border:'1px solid #e2e8f0' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:'1rem', marginBottom:16, color:'#334155' }}>
                          <span>✨</span> อุปนิสัยวันนี้
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                          {Object.values(behaviorGroups).map(g => {
                            const excellent = g.items.filter(s => s.score >= s.max_score);
                            const good      = g.items.filter(s => s.score > 0 && s.score < s.max_score);
                            const improve   = g.items.filter(s => s.score === 0);
                            return (
                              <div key={g.name_th}>
                                {habitTier.map(tier => {
                                  const items = tier.key==='excellent' ? excellent : tier.key==='good' ? good : improve;
                                  if (!items.length) return null;
                                  return (
                                    <div key={tier.key} style={{ marginBottom:16 }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, color:tier.color }}>
                                        <FaceIcon type={tier.face} color={tier.color} />
                                        <span style={{ fontWeight:700, fontSize:'0.9rem' }}>{tier.label}</span>
                                      </div>
                                      {/* habit-stack: inline pills + full cards with note */}
                                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                        {items.map(s => {
                                          const hasNote = !!(s as BehaviorScore & { note?: string }).note;
                                          return hasNote ? (
                                            <div key={s.item_id}
                                              style={{ width:'100%', display:'flex', flexDirection:'column', padding:'10px 12px', borderRadius:12, border:`1px solid ${tier.border}`, background:tier.bg }}>
                                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                                                <span style={{ fontSize:'0.85rem', fontWeight:700, color:tier.textColor }}>{s.name_th}</span>
                                                <span style={{ fontSize:'0.8rem', color:tier.color }}>✓</span>
                                              </div>
                                              <div style={{ marginTop:6, fontSize:'0.75rem', color:'#64748b', lineHeight:1.4 }}>
                                                {(s as BehaviorScore & { note?: string }).note}
                                              </div>
                                            </div>
                                          ) : (
                                            <div key={s.item_id}
                                              style={{ display:'flex', alignItems:'center', padding:'6px 12px', borderRadius:20, border:`1px solid ${tier.border}`, background:tier.bg }}>
                                              <span style={{ fontSize:'0.85rem', fontWeight:700, color:tier.textColor }}>{s.name_th}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Nap */}
                    <div style={{ background:'white', borderRadius:16, marginBottom:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'16px 20px 0' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:'1rem', color:'#4338ca' }}>
                          <span>😴</span> การนอนกลางวัน
                        </div>
                        {report.nap_from && report.nap_to && (
                          <div style={{ textAlign:'right' }}>
                            <span style={{ display:'block', fontSize:'1.1rem', fontWeight:800, color:'#1e1b4b' }}>
                              {(() => { const d=(new Date(`2000-01-01T${report.nap_to}`).getTime()-new Date(`2000-01-01T${report.nap_from}`).getTime())/60000; return `${Math.floor(d/60)} ชม. ${d%60} นาที`; })()}
                            </span>
                            <span style={{ fontSize:'0.75rem', color:'#818cf8', fontWeight:700 }}>{report.nap_from.slice(0,5)} - {report.nap_to.slice(0,5)} น.</span>
                          </div>
                        )}
                      </div>
                      <NapTimeline from={report.nap_from} to={report.nap_to} />
                    </div>

                    {/* Excretions */}
                    {(exDiaper.length > 0 || exPotty.length > 0) && (
                      <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:14, border:'1px solid #e2e8f0' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:'1rem', marginBottom:16, color:'#334155' }}>
                          <span>🚽</span> การขับถ่าย (Toilet)
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                          {exDiaper.length > 0 && (
                            <div style={{ background:'#fff7ed', padding:14, borderRadius:16, border:'1px solid #ffedd5' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10, color:'#c2410c' }}>
                                <span style={{ fontSize:'1.1rem' }}>👶</span>
                                <span style={{ fontWeight:800, fontSize:'0.9rem' }}>ผ้าอ้อม (Diapers)</span>
                              </div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                {[{label:'ฉี่ (Wet)',items:exDiaper.filter(e=>e.type==='pee'),color:'#9a3412'},{label:'อึ (Soiled)',items:exDiaper.filter(e=>e.type==='poo'),color:'#9a3412'}].map(g => (
                                  <div key={g.label} style={{ background:'white', padding:8, borderRadius:10, textAlign:'center' }}>
                                    <span style={{ display:'block', fontSize:'0.7rem', color:g.color }}>{g.label}</span>
                                    <span style={{ fontWeight:700, color:'#4a5568' }}>{g.items.length} ครั้ง</span>
                                    <small style={{ display:'block', fontSize:'0.65rem', color:'#94a3b8' }}>{g.items.map(e=>e.time?.slice(0,5)).filter(Boolean).join(', ')||'-'}</small>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {exPotty.length > 0 && (
                            <div style={{ background:'#f0fdf4', padding:14, borderRadius:16, border:'1px solid #dcfce7' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10, color:'#15803d' }}>
                                <span style={{ fontSize:'1.1rem' }}>🚽</span>
                                <span style={{ fontWeight:800, fontSize:'0.9rem' }}>นั่งกระโถน (Potty)</span>
                              </div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                {[{label:'ฉี่ (Pee)',items:exPotty.filter(e=>e.type==='pee'),color:'#166534'},{label:'อึ (Poo)',items:exPotty.filter(e=>e.type==='poo'),color:'#166534'}].map(g => (
                                  <div key={g.label} style={{ background:'white', padding:8, borderRadius:10, textAlign:'center' }}>
                                    <span style={{ display:'block', fontSize:'0.7rem', color:g.color }}>{g.label}</span>
                                    <span style={{ fontWeight:700, color:'#4a5568' }}>{g.items.length} ครั้ง</span>
                                    <small style={{ display:'block', fontSize:'0.65rem', color:'#94a3b8' }}>{g.items.map(e=>e.time?.slice(0,5)).filter(Boolean).join(', ')||'-'}</small>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    {report.note && (
                      <div style={{ background:'#eff6ff', borderRadius:16, padding:'14px 18px', marginBottom:14, border:'1px solid #dbeafe' }}>
                        <p style={{ fontSize:'0.65rem', fontWeight:800, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>💬 ข้อความจากครู</p>
                        <p style={{ fontSize:'0.95rem', color:'#1e293b', lineHeight:1.7, margin:0 }}>{report.note}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign:'center', padding:'20px 0', borderTop:'1px solid #f1f5f9', marginTop:6 }}>
                      <p style={{ margin:'2px 0', color:'#94a3b8', fontSize:'0.8rem' }}>บันทึกโดยคุณครู</p>
                      <p style={{ margin:'2px 0', color:'#475569', fontWeight:600, fontSize:'0.85rem' }}>Happy Kids</p>
                    </div>
                  </>)}
                </div>
              )}
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}
