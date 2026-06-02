'use client';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, DailyReport, Attendance, MilkStatus, ExcretionType, ExcretionAction, AppUser } from '@/types';

/* ── label maps ─────────────────────────────── */
const amtL: Record<MilkStatus,string> = { all:'ทานหมด', some:'ทานครึ่งเดียว', not_must:'ไม่จำเป็น', skip:'ไม่ทาน' };
const amtStyle: Record<MilkStatus,{bg:string;color:string}> = {
  all:      {bg:'#dcfce7',color:'#15803d'},
  some:     {bg:'#fef3c7',color:'#b45309'},
  not_must: {bg:'#dbeafe',color:'#1e40af'},
  skip:     {bg:'#ffe4e6',color:'#9f1239'},
};
const attL:  Record<string,string> = { present:'😊 มาเรียน', absent:'😴 ขาดเรียน', sick:'🤒 ป่วย', leave:'📝 ลา' };
const attC:  Record<string,string> = { present:'#10b981', absent:'#ef4444', sick:'#f59e0b', leave:'#3b82f6' };
const attBg: Record<string,string> = { present:'#ecfdf5', absent:'#fef2f2', sick:'#fffbeb', leave:'#eff6ff' };

interface BehaviorScore {
  item_id:string; name_th:string; name_en:string; score:number; max_score:number;
  category_id:string; category_name_th:string;
  note?:string;
}
interface DayEntry { date:string; daily_id:string; report_id:string|null }
interface DateSquare {
  date: Date;
  dateStr: string;     // YYYY-MM-DD format
  status: string | null;
  hasReport: boolean;
  dayIdx: number | null;  // Index in dayEntries array, null if no report
  isHoliday: boolean;  // Is this date a holiday?
  holidayName?: string; // Holiday name if isHoliday is true
  activity?: string;    // Activity name if available
}
interface WeekColumn {
  days: DateSquare[];
  monthLabel: string;  // Empty string if not first week of month
}
interface MonthSpan {
  label: string;       // e.g., "ม.ค.", "ก.พ."
  startWeekIdx: number;
  weekCount: number;
}

/* ── Helper Functions ─────────────────────────────── */
// Parse YYYY-MM-DD string as local date (not UTC to avoid timezone shift)
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Map attendance status to color
const getStatusColor = (status: string | null): string => {
  if (!status) return '#e2e8f0';
  switch (status) {
    case 'present': return '#10b981';
    case 'leave': return '#f59e0b';
    case 'sick': return '#fbbf24';
    case 'absent': return '#ef4444';
    default: return '#e2e8f0';
  }
};

// Format month label in Thai abbreviation
const formatMonthLabel = (date: Date): string => {
  return date.toLocaleDateString('th-TH', { month: 'short' });
};

/* ── Core Algorithm Functions ─────────────────────────────── */
// Find dayIdx for a given date string in dayEntries array
const findDayIdxForDate = (dateStr: string, dayEntries: DayEntry[]): number | null => {
  const idx = dayEntries.findIndex(entry => entry.date === dateStr);
  return idx >= 0 ? idx : null;
};

// Generate weeks with report mapping
const generateWeeksWithReportMapping = (
  attendanceSummary: { date: string; status: string }[],
  dayEntries: DayEntry[],
  enrollmentPeriod: { start: string; end: string | null } | null,
  holidays: { date: string; name_th: string }[],
  activities: { date: string; activity: string }[]
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
  const dateMap = new Map(attendanceSummary.map(d => [d.date, d.status]));
  const dayEntriesMap = new Map(dayEntries.map((entry, idx) => [entry.date, idx]));
  const holidaysMap = new Map(holidays.map(h => [h.date, h.name_th]));
  const activitiesMap = new Map(activities.map(a => [a.date, a.activity]));

  // Generate weeks
  const weeks: WeekColumn[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const week: DateSquare[] = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const status = dateMap.get(dateStr) ?? null;
      const dayIdx = dayEntriesMap.get(dateStr) ?? null;
      const hasReport = dayIdx !== null; // Has report if date exists in dayEntries
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
const calculateMonthSpans = (weeks: WeekColumn[]): MonthSpan[] => {
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

const parseDate = (d?:string|null) => {
  if (!d) return null;
  const s = d.slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? parseLocalDate(s) : null;
};
const thDate = (d?:string|null) =>
  parseDate(d)?.toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) ?? '';

/* ── shimmer ──────────────────────────────── */
const shimmer: React.CSSProperties = {
  background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:8,
};
const SkRow = ({w='100%',h=14,mb=0}:{w?:string|number;h?:number;mb?:number}) =>
  <div style={{...shimmer,width:w,height:h,marginBottom:mb}} />;
const SkCircle = ({size=40}:{size?:number}) =>
  <div style={{...shimmer,width:size,height:size,borderRadius:'50%',flexShrink:0}} />;

/* ── face icons ─────────────────────────────*/
const FaceHappy = ({size=22,color='#10b981'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <path d="M28 38 Q34 28 40 38" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path d="M60 38 Q66 28 72 38" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 58 Q50 82 72 58" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceSmile = ({size=22,color='#3b82f6'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <circle cx="35" cy="38" r="4" fill={color}/><circle cx="65" cy="38" r="4" fill={color}/>
    <path d="M35 58 Q50 72 65 58" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceNeutral = ({size=22,color='#f59e0b'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <circle cx="35" cy="38" r="4" fill={color}/><circle cx="65" cy="38" r="4" fill={color}/>
    <line x1="35" y1="62" x2="65" y2="62" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

/* ── StatusPill ─────────────────────────────*/
const Pill = ({status}:{status:MilkStatus}) => (
  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:6,fontSize:'0.65rem',fontWeight:700,alignSelf:'flex-start',...amtStyle[status]}}>
    {amtL[status]}
  </span>
);

/* ── Avatar ─────────────────────────────────*/
function Avatar({src,name,size=42,active,accentColor='#6366f1'}:{src?:string|null;name?:string|null;size?:number;active?:boolean;accentColor?:string}) {
  const initial = (name ?? '?').slice(0,1).toUpperCase();
  const colors  = ['#E8754A','#6366f1','#4A90B8','#4CAF76','#F5A623','#E85C5C','#ec4899','#34d399'];
  const bg      = colors[(initial.charCodeAt(0))%colors.length];
  return src
    ? <img src={src} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:'50%',background:active?bg:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',color:active?'white':'#94a3b8',fontSize:size*0.4,fontWeight:700,border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}}>
        {initial}
      </div>;
}

/* ── Custom Tooltip ─────────────────────────────────*/
function CustomTooltip({children,text}:{children:React.ReactNode;text:string}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({x:0,y:0,align:'center'});
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Check if we're in the browser
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const topY = rect.top - 8;
    
    // Check if tooltip will overflow screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 200; // max-width of tooltip
    const tooltipHeight = 60; // estimated height
    const padding = 16; // padding from screen edges
    
    let align = 'center';
    let x = centerX;
    let y = topY;
    
    // Check if tooltip will overflow top of screen
    if (topY - tooltipHeight < padding) {
      // Not enough space above, position below instead
      y = rect.bottom + 8;
    }
    
    // If too close to right edge, align right
    if (centerX + tooltipWidth/2 > viewportWidth - padding) {
      align = 'right';
      x = Math.min(rect.right, viewportWidth - padding);
    }
    // If too close to left edge, align left
    else if (centerX - tooltipWidth/2 < padding) {
      align = 'left';
      x = Math.max(rect.left, padding);
    }
    
    setPos({x, y:topY, align});
    setShow(true);
  };
  
  const handleMouseLeave = () => {
    setShow(false);
  };
  
  const getTransform = () => {
    if (pos.align === 'left') return 'translate(0, -100%)';
    if (pos.align === 'right') return 'translate(-100%, -100%)';
    return 'translate(-50%, -100%)';
  };
  
  const getArrowStyle = () => {
    if (pos.align === 'left') return {left: 5};
    if (pos.align === 'right') return {right: 5};
    return {left: '50%', transform: 'translateX(-50%)'};
  };
  
  // Render tooltip in a portal to body to avoid overflow clipping
  const tooltipPortal = isMounted && show && typeof document !== 'undefined' ? (
    ReactDOM.createPortal(
      <div ref={tooltipRef} style={{
        position:'fixed',
        left:pos.x,
        top:pos.y,
        transform:getTransform(),
        background:'rgba(15, 23, 42, 0.95)',
        color:'white',
        padding:'8px 12px',
        borderRadius:6,
        fontSize:'0.7rem',
        fontWeight:500,
        whiteSpace:'pre-line',
        pointerEvents:'none',
        zIndex:99999,
        boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
        maxWidth:'min(200px, calc(100vw - 32px))',
        textAlign:'center',
        lineHeight:1.4,
        wordBreak:'break-word'
      }}>
        {text}
        <div style={{
          position:'absolute',
          bottom:-4,
          ...getArrowStyle(),
          width:0,
          height:0,
          borderLeft:'4px solid transparent',
          borderRight:'4px solid transparent',
          borderTop:'4px solid rgba(15, 23, 42, 0.95)'
        }} />
      </div>,
      document.body
    )
  ) : null;
  
  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{position:'relative'}}>
        {children}
      </div>
      {tooltipPortal}
    </>
  );
}

/* ─────────────────────────────────────────── */
export default function LiffPage() {
  const liff = useLiff();
  const router = useRouter();

  const [parents,  setParents]  = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId,  setChildId]  = useState<string|null>(null);

  const [dayEntries,  setDayEntries]  = useState<DayEntry[]>([]);
  const [dayIdx,      setDayIdx]      = useState(0);
  const [report,      setReport]      = useState<DailyReport|null>(null);
  const [attendance,  setAttendance]  = useState<Attendance|null>(null);
  const [scores,      setScores]      = useState<BehaviorScore[]>([]);
  const [teacher,     setTeacher]     = useState<AppUser|null>(null);

  const [childLoading,  setChildLoading]  = useState(false);
  const [daysLoading,   setDaysLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<{date:string;status:string}[]>([]);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<{start:string;end:string|null}|null>(null);
  const [holidays, setHolidays] = useState<{date:string;name_th:string}[]>([]);
  const [activities, setActivities] = useState<{date:string;activity:string}[]>([]);
  const [behaviorSummary, setBehaviorSummary] = useState<{
    item_id:string;
    name_th:string;
    category_name_th:string;
    avg_score:number;
    max_score:number;
    daily_scores:{date:string;score:number}[];
    days_recorded:number;
  }[]>([]);
  const [activeTab, setActiveTab] = useState<'daily'|'summary'>('daily'); // Tab state
  const [cohortId, setCohortId] = useState<string|null>(null); // Store cohort_id from enrollment

  /* ── LIFF ready ── */
  useEffect(() => {
    if (!liff.ready) return;
    if (!liff.profile?.userId) {
      fetch('/api/report/children').then(r=>r.json()).then(j=>{
        setChildren(j.data??[]);
      });
      return;
    }
    setChildLoading(true);
    fetch('/api/auth/line-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line_user_id:liff.profile.userId,display_name:liff.profile.displayName,picture_url:liff.profile.pictureUrl??null})})
    .then(r=>r.json())
    .then(async regJson => {
      if (regJson.status === 403) {
        setNotRegistered(true);  // แสดงหน้า "ติดต่อครู"
        return;
      }
      const user = regJson.data;
      // ถ้าเป็น teacher → redirect ไป admin/users
      if (user?.role === 'teacher') {
        router.replace('/admin/users');
        return;
      }
      // parent → โหลดลูก
      const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
      const childJson = await childRes.json();
      const kids:Child[] = childJson.data??[];
      setChildren(kids);
      if (kids.length===0) setNotRegistered(true);
    })
    .catch(()=>setNotRegistered(true))
    .finally(()=>setChildLoading(false));
  },[liff.ready,liff.profile?.userId]);

  useEffect(()=>{
    if (children.length > 0 && !childId) {
      setChildId(children[0].id);
    }
  },[children, childId]);

  /* ── child → parents ── */
  useEffect(()=>{
    if (!childId) { setParents([]); setParentId(null); return; }
    setParentId(null); // reset parent selection when child changes
    let cancelled = false;
    fetch(`/api/report/child-parents?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) setParents(j.data??[]);
      });
    return () => { cancelled = true; };
  },[childId]);

  /* ── child → days ── */
  useEffect(()=>{
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); setDayIdx(0); setReport(null); setAttendance(null); setScores([]);
    let cancelled = false;
    
    // Load days
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) setDayEntries(j.data??[]);
      })
      .finally(()=>{
        if (!cancelled) setDaysLoading(false);
      });
    
    // Load attendance summary for contribution graph
    fetch(`/api/report/attendance-summary?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) setAttendanceSummary(j.data??[]);
      });
    
    // Load enrollment period
    fetch(`/api/report/enrollment-period?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled && j.data?.start_date) {
          const period = {
            start: j.data.start_date,
            end: j.data.end_date
          };
          setEnrollmentPeriod(period);
          
          // Store cohort_id for holidays API
          const enrollmentCohortId = j.data.cohort_id || null;
          setCohortId(enrollmentCohortId);
          
          // Load holidays for this period
          const endDateStr = period.end || (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          })();
          let holidaysUrl = `/api/holidays?start_date=${period.start}&end_date=${endDateStr}`;
          if (enrollmentCohortId) {
            holidaysUrl += `&cohort_id=${enrollmentCohortId}`;
          }
          fetch(holidaysUrl).then(r=>r.json())
            .then(j=>{
              if (!cancelled) setHolidays(j.data??[]);
            });
          
          // Load activities for this period
          fetch(`/api/report/activities?child_id=${childId}&start_date=${period.start}&end_date=${endDateStr}`)
            .then(r=>r.json())
            .then(j=>{
              if (!cancelled) setActivities(j.data??[]);
            });
        }
      });
    
    return () => { cancelled = true; };
  },[childId]);

  /* ── Load behavior summary for entire enrollment period ── */
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    
    let cancelled = false;
    
    // Always use full enrollment period
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFrom = enrollmentPeriod.start;
    const dateTo = enrollmentPeriod.end || todayStr;
    
    fetch(`/api/report/behavior-summary?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          // Map items with daily_scores and days_recorded
          const items = (j.data ?? []).map((item: any) => ({
            item_id: item.item_id,
            name_th: item.name_th,
            category_name_th: item.category_name_th,
            avg_score: parseFloat(item.avg_score),
            max_score: item.max_score,
            daily_scores: item.daily_scores || [],
            days_recorded: item.days_recorded || 0
          }));
          setBehaviorSummary(items);
        }
      });
    
    return () => { cancelled = true; };
  }, [childId, enrollmentPeriod]);

  /* ── day → report ── */
  useEffect(()=>{
    const entry = dayEntries[dayIdx];
    if (!entry||!childId){setReport(null);setAttendance(null);setScores([]);return;}
    setReportLoading(true);
    let cancelled = false;
    Promise.all([
      entry.report_id ? fetch(`/api/daily-reports/${entry.report_id}`).then(r=>r.json()) : Promise.resolve({data:null}),
      fetch(`/api/attendance?daily_id=${entry.daily_id}&child_id=${childId}`).then(r=>r.json()),
      fetch(`/api/behavior-scores?daily_id=${entry.daily_id}&child_id=${childId}`).then(r=>r.json()),
    ]).then(([rj,aj,bj])=>{
      if (cancelled) return;
      const rep = rj.data??null;
      setReport(rep); setAttendance((aj.data??[])[0]??null); setScores(bj.data??[]);
      // load teacher
      if (rep?.created_by) fetch(`/api/users/${rep.created_by}`).then(r=>r.json()).then(j=>{
        if (!cancelled) setTeacher(j.data??null);
      }).catch(()=>{});
      else setTeacher(null);
    }).finally(()=>{
      if (!cancelled) setReportLoading(false);
    });
    return () => { cancelled = true; };
  },[dayIdx,dayEntries,childId]);

  const selectedChild  = children.find(c=>c.id===childId);
  const currentEntry   = dayEntries[dayIdx];
  const behaviorGroups = scores.reduce<Record<string,{name_th:string;items:BehaviorScore[]}>>((acc,s)=>{
    if (!acc[s.category_id]) acc[s.category_id]={name_th:s.category_name_th,items:[]};
    acc[s.category_id].items.push(s); return acc;
  },{});
  const exDiaper = report?.excretions?.filter(e=>e.action==='diaper')??[];
  const exPotty  = report?.excretions?.filter(e=>e.action==='potty')??[];

  /* ── loading ── */
  if (!liff.ready) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'#f8fafc'}}>
      <div style={{width:40,height:40,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notRegistered&&!childLoading) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#f8fafc'}}>
      <div style={{background:'white',borderRadius:20,padding:28,textAlign:'center',maxWidth:300,border:'1px solid #e2e8f0'}}>
        <p style={{fontSize:48,marginBottom:12}}>🏫</p>
        <h2 style={{fontWeight:800,color:'#0f172a',marginBottom:8}}>ยังไม่มีข้อมูล</h2>
        <p style={{fontSize:14,color:'#64748b',lineHeight:1.6}}>LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน<br/>กรุณาติดต่อคุณครูเพื่อลงทะเบียน</p>
      </div>
    </div>
  );

  return (
    <div style={{background:'#f8fafc',minHeight:'100dvh',display:'flex',justifyContent:'center'}}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .fade{animation:fadeIn .25s ease}
        *{box-sizing:border-box}
        .avatar-row{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
        .avatar-row::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{width:'100%',maxWidth:480,background:'white',minHeight:'100dvh',paddingBottom:'calc(88px + env(safe-area-inset-bottom,0px))'}}>

        {/* ─── HEADER ─────────────────────────────── */}
        <header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>

          {/* two-way selector */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:12}}>

            {/* ฝั่งผู้ปกครอง */}
            <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden'}}>
              <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>ผู้ปกครอง</span>
              <div className="avatar-row">
                {childLoading ? [1,2].map(i=><SkCircle key={i} size={42}/>) :
                  parents.map(p=>(
                    <button key={p.id} type="button" onClick={()=>setParentId(parentId===p.id?null:p.id)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0}}>
                      <Avatar src={p.picture_url} name={p.display_name} size={42} active={parentId===p.id} accentColor="#f472b6" />
                      <div style={{width:4,height:4,borderRadius:'50%',background:parentId===p.id?'#f472b6':'transparent',transition:'all .2s'}} />
                    </button>
                  ))
                }
              </div>
            </div>

            {/* ❤️ connector */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#ff8787',fontSize:'1.1rem',padding:'0 6px',alignSelf:'center',marginTop:10,flexShrink:0}}>
              ❤️
            </div>

            {/* ฝั่งลูก */}
            <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden',alignItems:'flex-end'}}>
              <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>ลูก / หลาน</span>
              <div className="avatar-row" style={{justifyContent:'flex-end',direction:'rtl'}}>
                {childLoading ? [1,2,3].map(i=><SkCircle key={i} size={42}/>) :
                  children.map(c=>(
                    <button key={c.id} type="button" onClick={()=>setChildId(c.id)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                      <Avatar src={c.photo_url} name={c.name_th} size={42} active={childId===c.id} accentColor="#6366f1" />
                      <div style={{width:4,height:4,borderRadius:'50%',background:childId===c.id?'#6366f1':'transparent',transition:'all .2s'}} />
                    </button>
                  ))
                }
              </div>
            </div>
          </div>

          {/* title zone — center */}
          <div style={{textAlign:'center',marginTop:4}}>
              <p style={{margin:'0 0 4px',fontSize:'0.78rem',fontWeight:600,color:'#f472b6',transition:'all .2s'}}>
                {parents.find(p=>p.id===parentId)?.display_name ?? '\u00A0'}
              </p>
            {childLoading ? (
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',marginTop:4}}>
                <SkRow w={160} h={22} /><SkRow w={200} h={14} />
              </div>
            ) : (
              <>
                <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#0f172a',letterSpacing:'-0.3px'}}>
                  {selectedChild?.name_th ?? 'เลือกบุตรหลาน'}
                </h1>
                <p style={{margin:'4px 0 0',fontSize:'0.75rem',color:'#64748b',fontWeight:500}}>
                  {currentEntry ? thDate(currentEntry.date) : 'กรุณาเลือกบุตรหลาน'}
                </p>
              </>
            )}
          </div>
        </header>

        {/* ─── CONTRIBUTION GRAPH (แทน DATE STRIP) ─────────────────── */}
        {!childLoading && childId && activeTab === 'daily' && (attendanceSummary.length > 0 || enrollmentPeriod) && (
          <div style={{padding:'16px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <span style={{fontSize:'0.7rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em'}}>การเข้าเรียน</span>
                {enrollmentPeriod && (
                  <span style={{fontSize:'0.6rem',color:'#94a3b8'}}>
                    {parseLocalDate(enrollmentPeriod.start).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})}
                    {' - '}
                    {enrollmentPeriod.end ? parseLocalDate(enrollmentPeriod.end).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}) : 'ปัจจุบัน'}
                  </span>
                )}
              </div>
              <div style={{display:'flex',gap:8,fontSize:'0.65rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:8,height:8,borderRadius:2,background:'#10b981'}} /><span style={{color:'#64748b'}}>มา</span></div>
                <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:8,height:8,borderRadius:2,background:'#f59e0b'}} /><span style={{color:'#64748b'}}>ลา</span></div>
                <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:8,height:8,borderRadius:2,background:'#ef4444'}} /><span style={{color:'#64748b'}}>ขาด</span></div>
                <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:8,height:8,borderRadius:2,background:'#c084fc'}} /><span style={{color:'#64748b'}}>หยุด</span></div>
              </div>
            </div>
            <div style={{overflowX:'auto',scrollbarWidth:'none',WebkitOverflowScrolling:'touch',overflowY:'visible'}}>
              {(() => {
                // Generate weeks with report mapping
                const weeks = generateWeeksWithReportMapping(attendanceSummary, dayEntries, enrollmentPeriod, holidays, activities);
                
                const monthSpans = calculateMonthSpans(weeks);

                if (weeks.length === 0) {
                  return <div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:'0.75rem'}}>ไม่มีข้อมูลการเข้าเรียน</div>;
                }

                return (
                  <div style={{display:'flex',gap:3,minWidth:'fit-content'}}>
                    {/* Day labels column */}
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {/* Empty space for month labels row */}
                      <div style={{height:14,marginBottom:2}} />
                      {/* Day labels */}
                      {['อา','จ','อ','พ','พฤ','ศ','ส'].map((day,i)=>(
                        <div key={i} style={{height:10,fontSize:'0.6rem',color:'#94a3b8',display:'flex',alignItems:'center',fontWeight:600}}>{day}</div>
                      ))}
                    </div>

                    {/* Month labels row + weeks grid */}
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {/* Month labels row */}
                      <div style={{display:'flex',gap:3,height:14,marginBottom:2}}>
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
                      <div style={{display:'flex',gap:3}}>
                        {weeks.map((week, weekIdx) => (
                          <div key={weekIdx} style={{display:'flex',flexDirection:'column',gap:2}}>
                            {week.days.map((day, dayIdxInWeek) => {
                              const isSelected = day.dayIdx === dayIdx;
                              // If holiday, use purple color, otherwise use status color
                              const color = day.isHoliday ? '#c084fc' : getStatusColor(day.status);
                              
                              // Build tooltip text
                              let tooltipText = day.date.toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short',year:'2-digit'});
                              if (day.isHoliday && day.holidayName) {
                                tooltipText += ` - 🏖️ ${day.holidayName}`;
                              } else {
                                const statusLabel = day.status === 'present' ? 'มาเรียน' :
                                                  day.status === 'leave' ? 'ลา' :
                                                  day.status === 'sick' ? 'ป่วย' :
                                                  day.status === 'absent' ? 'ขาดเรียน' : 'ไม่มีข้อมูล';
                                tooltipText += ` - ${statusLabel}`;
                                if (day.activity) {
                                  tooltipText += `\n📚 ${day.activity}`;
                                }
                              }

                              return (
                                <CustomTooltip key={dayIdxInWeek} text={tooltipText}>
                                  <div
                                    onClick={() => {
                                      // Don't allow clicking on holidays
                                      if (!day.isHoliday && day.hasReport && day.dayIdx !== null) {
                                        setDayIdx(day.dayIdx);
                                      }
                                    }}
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 2,
                                      background: color,
                                      opacity: day.isHoliday ? 0.8 : (day.hasReport ? 1.0 : 0.5),
                                      border: isSelected ? '2px solid #6366f1' : 'none',
                                      cursor: day.isHoliday ? 'default' : (day.hasReport ? 'pointer' : 'default'),
                                      flexShrink: 0,
                                      transition: 'all .15s',
                                      boxSizing: 'border-box'
                                    }}
                                    onMouseEnter={e => {
                                      if (!day.isHoliday && day.hasReport) {
                                        e.currentTarget.style.transform = 'scale(1.3)';
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  />
                                </CustomTooltip>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ─── BEHAVIOR SUMMARY ─────────────────────────────── */}
        {!childLoading && childId && activeTab === 'summary' && behaviorSummary.length > 0 && (
          <div style={{padding:'16px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <span style={{fontSize:'0.7rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em'}}>🌟 สรุปอุปนิสัย</span>
                <span style={{fontSize:'0.6rem',color:'#94a3b8'}}>
                  คะแนนเฉลี่ยตลอดช่วงเรียน
                </span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {(() => {
                // Group by category
                const grouped = behaviorSummary.reduce<Record<string, typeof behaviorSummary>>((acc, item) => {
                  if (!acc[item.category_name_th]) acc[item.category_name_th] = [];
                  acc[item.category_name_th].push(item);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([categoryName, items]) => (
                  <div key={categoryName} style={{display:'flex',flexDirection:'column',gap:6}}>
                    {/* Category header */}
                    <div style={{fontSize:'0.7rem',fontWeight:700,color:'#6366f1',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      {categoryName}
                    </div>
                    {/* Items in category */}
                    {items.map((item) => {
                      const percentage = (item.avg_score / item.max_score) * 100;
                      const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
                      
                      // Get today's score (last item in daily_scores)
                      const todayScore = item.daily_scores.length > 0 
                        ? item.daily_scores[item.daily_scores.length - 1].score 
                        : null;
                      
                      return (
                        <div key={item.item_id} style={{display:'flex',flexDirection:'column',gap:6,paddingLeft:8,background:'#fafafa',padding:12,borderRadius:10}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.75rem',fontWeight:600,color:'#475569'}}>{item.name_th}</span>
                          </div>
                          
                          {/* Sparkline bar chart */}
                          <div style={{display:'flex',alignItems:'flex-end',gap:1,height:24}}>
                            {item.daily_scores.slice(-14).map((day, idx) => {
                              const barHeight = (day.score / item.max_score) * 100;
                              const barColor = (day.score / item.max_score) >= 0.8 ? '#10b981' : 
                                             (day.score / item.max_score) >= 0.6 ? '#f59e0b' : '#ef4444';
                              return (
                                <div
                                  key={idx}
                                  title={`${day.date}: ${day.score}/${item.max_score}`}
                                  onClick={() => {
                                    // Find the dayIdx for this date
                                    const foundIdx = dayEntries.findIndex(entry => entry.date === day.date);
                                    if (foundIdx >= 0) {
                                      setDayIdx(foundIdx);
                                      setActiveTab('daily');
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    height: `${barHeight}%`,
                                    minHeight: 2,
                                    background: barColor,
                                    borderRadius: 1,
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ─── CONTENT ────────────────────────────── */}
        {activeTab === 'daily' && (
        <div style={{padding:'16px 16px 0'}}>

          {reportLoading && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{...shimmer,height:70,borderRadius:16}} />
              <div style={{...shimmer,height:180,borderRadius:16}} />
              <div style={{...shimmer,height:140,borderRadius:16}} />
            </div>
          )}

          {!reportLoading && childId && (
            <div className="fade">

              {/* Attendance */}
              {attendance && (
                <div style={{background:attBg[attendance.status],borderRadius:16,padding:'14px 18px',marginBottom:14,display:'flex',alignItems:'center',gap:12,border:`1px solid ${attC[attendance.status]}22`}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {attendance.status==='present'?'😊':attendance.status==='sick'?'🤒':attendance.status==='absent'?'😴':'📝'}
                  </div>
                  <div>
                    <p style={{fontSize:10,color:attC[attendance.status],fontWeight:800,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>สถานะวันนี้</p>
                    <p style={{fontSize:17,fontWeight:800,color:attC[attendance.status],margin:0}}>{attL[attendance.status]}</p>
                    {attendance.note&&<p style={{fontSize:12,color:'#475569',marginTop:3}}>{attendance.note}</p>}
                  </div>
                </div>
              )}

              {!report && !attendance && dayEntries.length>0 && (
                <div style={{background:'white',borderRadius:16,padding:'32px',textAlign:'center',border:'1px solid #e2e8f0',marginBottom:14}}>
                  <p style={{fontSize:32,marginBottom:8}}>📋</p>
                  <p style={{color:'#94a3b8',fontSize:14}}>ยังไม่มีรายงานสำหรับวันนี้</p>
                </div>
              )}

              {report && (<>

                {/* Activity */}
                {report.daily?.activity && (
                  <div style={{background:'white',borderRadius:16,padding:'20px',marginBottom:14,border:'1px solid #e2e8f0',textAlign:'center'}}>
                    <span style={{fontSize:'0.7rem',fontWeight:800,color:'#6366f1',textTransform:'uppercase',letterSpacing:1.5,display:'block',marginBottom:6}}>TODAY&apos;S ACTIVITY</span>
                    <h2 style={{fontSize:'1.2rem',fontWeight:700,color:'#0f172a',margin:0,letterSpacing:'-0.2px'}}>{report.daily.activity}</h2>
                  </div>
                )}

                {/* Food & Milk */}
                <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:14,color:'#334155'}}>
                    <span style={{marginRight:8,fontSize:'1.1rem'}}>🥣</span> อาหารและโภชนาการ
                  </div>

                  {(report.daily?.food||report.daily?.fruit)&&(
                    <div className="food-grid">
                      {report.daily?.food&&(
                        <div className={`food-item`}>
                          <div>
                            <span className="food-label">มื้อกลางวัน</span>
                            <span className="food-name">{report.daily.food}</span>
                          </div>
                          {report.food_amount&&(
                            <span className={`status-pill status-${report.food_amount.replace('_','-')}`}>{amtL[report.food_amount]}</span>
                          )}
                          <div className="food-note" style={{
                            borderTop: report.food_note
                                ? '1px solid #e2e8f0'
                                : '1px solid #f8fafc'
                            }}
                            >
                            {report.food_note ? (<>💬 {report.food_note}</>) : ('\u00A0')}
                          </div>
                        </div>
                      )}
                      {report.daily?.fruit&&(
                        <div className={`food-item`}>
                          <div>
                            <span className="food-label">ผลไม้</span>
                            <span className="food-name">{report.daily.fruit}</span>
                          </div>
                          {report.fruit_amount&&(
                            <span className={`status-pill status-${report.fruit_amount.replace('_','-')}`}>{amtL[report.fruit_amount]}</span>
                          )}
                          <div className="food-note" style={{
                            borderTop: report.fruit_note
                                ? '1px solid #e2e8f0'
                                : '1px solid #f8fafc'
                            }}
                            >
                            {report.fruit_note ? (<>💬 {report.fruit_note}</>) : ('\u00A0')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(report.milk1!=='skip'||report.milk2!=='skip')&&(
                    <div className="milk-section">
                      <h3 className="milk-section-title">🥛 การดื่มนมประจำวัน</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {[{label:'กล่องที่ 1 (เช้า)',val:report.milk1,note:report.milk1_note},{label:'กล่องที่ 2 (บ่าย)',val:report.milk2,note:report.milk2_note}]
                          .filter(m=>m.val!=='skip')
                          .map(m=>(
                            <div key={m.label} className={`milk-box amt-${m.val.replace('_','-')}`}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,width:'100%'}}>
                                <span className="milk-box-label">{m.label}</span>
                                <span className="milk-tag">{amtL[m.val]}</span>
                              </div>
                              {m.note&&<div className="milk-note">{m.note}</div>}
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Behaviors */}
                {scores.length>0&&(
                  <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:16,color:'#334155'}}>
                      <span style={{marginRight:8,fontSize:'1.1rem'}}>✨</span> อุปนิสัยวันนี้
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      {Object.values(behaviorGroups).map(g=>{
                        const excellent = g.items.filter(s=>s.score>=s.max_score);
                        const good      = g.items.filter(s=>s.score>0&&s.score<s.max_score);
                        const improve   = g.items.filter(s=>s.score===0);
                        return (
                          <div key={g.name_th}>
                            <p style={{fontSize:'0.78rem',fontWeight:800,color:'#7c3aed',marginBottom:10}}>{g.name_th}</p>
                            {[
                              {items:excellent, face:<FaceHappy />, label:'ทำได้ดีเยี่ยม', color:'#10b981', tagBg:'#f0fdf4', tagBorder:'#bbf7d0', tagColor:'#166534'},
                              {items:good,      face:<FaceSmile />, label:'ทำได้ดี',       color:'#3b82f6', tagBg:'#eff6ff', tagBorder:'#bfdbfe', tagColor:'#1e40af'},
                              {items:improve,   face:<FaceNeutral />, label:'ควรส่งเสริม', color:'#f59e0b', tagBg:'#fffbeb', tagBorder:'#fde68a', tagColor:'#92400e'},
                            ].filter(gr=>gr.items.length>0).map(gr=>(
                              <div key={gr.label} style={{marginBottom:10}}>
                                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,color:gr.color}}>
                                  {gr.face}
                                  <span style={{fontWeight:700,fontSize:'0.9rem'}}>{gr.label}</span>
                                </div>
                                {/* habit-stack: inline tags + full-width tags with notes */}
                                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                                  {gr.items.map(s=>{
                                    const hasNote = !!s.note;
                                    return hasNote ? (
                                      <div key={s.item_id} style={{width:'100%',display:'flex',flexDirection:'column',padding:'10px 12px',borderRadius:12,border:`1px solid ${gr.tagBorder}`,background:gr.tagBg}}>
                                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',gap:8}}>
                                          <span style={{fontSize:'0.85rem',fontWeight:700,color:gr.tagColor}}>{s.name_th}</span>
                                          <span style={{fontSize:'0.72rem',color:gr.tagColor,opacity:0.7}}>✓</span>
                                        </div>
                                        <div style={{marginTop:6,fontSize:'0.75rem',color:'#64748b',lineHeight:1.4}}>{s.note}</div>
                                      </div>
                                    ) : (
                                      <div key={s.item_id} style={{display:'flex',alignItems:'center',padding:'6px 12px',borderRadius:20,border:`1px solid ${gr.tagBorder}`,background:gr.tagBg}}>
                                        <span style={{fontSize:'0.85rem',fontWeight:700,color:gr.tagColor}}>{s.name_th}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nap */}
                <div style={{background:'white',borderRadius:16,padding:'20px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',color:'#4338ca',gap:8}}>
                      <span>😴</span> การนอนกลางวัน
                    </div>
                    {report.nap_from&&report.nap_to&&(
                      <div style={{textAlign:'right'}}>
                        <span style={{display:'block',fontSize:'1.05rem',fontWeight:800,color:'#1e1b4b'}}>
                          {(()=>{const d=(new Date('2000-01-01T'+report.nap_to).getTime()-new Date('2000-01-01T'+report.nap_from).getTime())/60000;return `${Math.floor(d/60)} ชม. ${d%60} นาที`;})()}
                        </span>
                        <span style={{fontSize:'0.75rem',color:'#818cf8',fontWeight:700}}>
                          {report.nap_from.slice(0,5)} - {report.nap_to.slice(0,5)} น.
                        </span>
                      </div>
                    )}
                  </div>
                  {report.nap_from&&report.nap_to ? (()=>{
                    const toMin=(t:string)=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
                    const start=9*60,end=15*60,total=end-start;
                    const ns=toMin(report.nap_from),ne=toMin(report.nap_to);
                    const left=((ns-start)/total)*100, width=((ne-ns)/total)*100;
                    return (
                      <div style={{position:'relative',paddingTop:16}}>
                        <div style={{position:'absolute',top:0,width:'100%',fontSize:'0.65rem',color:'#94a3b8',fontWeight:700}}>
                          <span style={{position:'absolute',left:0}}>09:00</span>
                          <span style={{position:'absolute',left:'50%',transform:'translateX(-50%)'}}>12:00</span>
                          <span style={{position:'absolute',right:0}}>15:00</span>
                        </div>
                        <div style={{width:'100%',height:10,background:'#f1f5f9',borderRadius:5,overflow:'hidden',margin:'6px 0'}}>
                          <div style={{position:'relative',height:'100%'}}>
                            <div style={{position:'absolute',left:`${left}%`,width:`${width}%`,height:'100%',background:'#818cf8',borderRadius:5}} />
                          </div>
                        </div>
                        <div style={{position:'relative',height:14,fontSize:'0.65rem',fontWeight:700,color:'#4338ca'}}>
                          <span style={{position:'absolute',left:`${left}%`,transform:'translateX(-50%)'}}>{report.nap_from.slice(0,5)}</span>
                          <span style={{position:'absolute',left:`${left+width}%`,transform:'translateX(-50%)'}}>{report.nap_to.slice(0,5)}</span>
                        </div>
                      </div>
                    );
                  })() : <p style={{color:'#94a3b8',fontSize:14}}>ไม่ได้นอนกลางวัน</p>}
                </div>

                {/* Excretions */}
                {(exDiaper.length>0||exPotty.length>0)&&(
                  <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:14,color:'#334155'}}>
                      <span style={{marginRight:8}}>🚽</span> การขับถ่าย
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {exDiaper.length>0&&(
                        <div style={{background:'#fff7ed',padding:14,borderRadius:14,border:'1px solid #ffedd5'}}>
                          <p style={{fontSize:'0.85rem',fontWeight:800,color:'#c2410c',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                            👶 ผ้าอ้อม (Diapers)
                          </p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[{label:'ฉี่ (Wet)',items:exDiaper.filter(e=>e.type==='pee')},{label:'อึ (Soiled)',items:exDiaper.filter(e=>e.type==='poo')}]
                              .filter(g=>g.items.length>0)
                              .map(g=>(
                                <div key={g.label} style={{background:'white',padding:8,borderRadius:10,textAlign:'center'}}>
                                  <span style={{display:'block',fontSize:'0.7rem',color:'#9a3412'}}>{g.label}</span>
                                  <span style={{fontWeight:700,color:'#4a5568'}}>{g.items.length} ครั้ง</span>
                                  <small style={{display:'block',fontSize:'0.65rem',color:'#94a3b8'}}>{g.items.map(e=>e.time?.slice(0,5)).filter(Boolean).join(', ')||'-'}</small>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {exPotty.length>0&&(
                        <div style={{background:'#f0fdf4',padding:14,borderRadius:14,border:'1px solid #dcfce7'}}>
                          <p style={{fontSize:'0.85rem',fontWeight:800,color:'#15803d',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                            🚽 นั่งกระโถน (Potty)
                          </p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[{label:'ฉี่ (Pee)',items:exPotty.filter(e=>e.type==='pee')},{label:'อึ (Poo)',items:exPotty.filter(e=>e.type==='poo')}]
                              .filter(g=>g.items.length>0)
                              .map(g=>(
                                <div key={g.label} style={{background:'white',padding:8,borderRadius:10,textAlign:'center'}}>
                                  <span style={{display:'block',fontSize:'0.7rem',color:'#166534'}}>{g.label}</span>
                                  <span style={{fontWeight:700,color:'#4a5568'}}>{g.items.length} ครั้ง</span>
                                  <small style={{display:'block',fontSize:'0.65rem',color:'#94a3b8'}}>{g.items.map(e=>e.time?.slice(0,5)).filter(Boolean).join(', ')||'-'}</small>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher note */}
                {report.note&&(
                  <div style={{background:'#eff6ff',borderRadius:16,padding:'16px 18px',marginBottom:14,border:'1px solid #dbeafe'}}>
                    <p style={{fontSize:'0.7rem',fontWeight:800,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>💬 ข้อความจากครู</p>
                    <p style={{fontSize:'0.95rem',color:'#1e293b',lineHeight:1.7,margin:0}}>{report.note}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{textAlign:'center',marginTop:24,paddingTop:16,borderTop:'1px solid #f1f5f9'}}>
                  <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'0.8rem'}}>บันทึกโดยคุณครู</p>
                  <p style={{margin:'2px 0',color:'#475569',fontWeight:600,fontSize:'0.88rem'}}>
                    {teacher?.display_name ?? 'KinderCare'}
                  </p>
                  {currentEntry&&<p style={{marginTop:8,fontSize:'0.72rem',color:'#94a3b8'}}>{thDate(currentEntry.date)}</p>}
                </div>
              </>)}

            </div>
          )}

          {!childId&&!childLoading&&(
            <div style={{textAlign:'center',padding:'48px 20px',color:'#94a3b8'}}>
              <p style={{fontSize:44,marginBottom:10}}>👆</p>
              <p style={{fontSize:'0.95rem'}}>เลือกบุตรหลานเพื่อดูรายงาน</p>
            </div>
          )}
        </div>
        )}

        {/* ─── BOTTOM NAVIGATION BAR ─────────────────────────────── */}
        {!childLoading && childId && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 480,
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            zIndex: 1000
          }}>
            <div style={{display: 'flex', height: 64}}>
              <button
                onClick={() => setActiveTab('daily')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: activeTab === 'daily' ? '#6366f1' : '#94a3b8'
                }}
              >
                <span style={{fontSize: '1.5rem'}}>📅</span>
                <span style={{fontSize: '0.7rem', fontWeight: activeTab === 'daily' ? 700 : 500}}>รายวัน</span>
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: activeTab === 'summary' ? '#6366f1' : '#94a3b8'
                }}
              >
                <span style={{fontSize: '1.5rem'}}>🌟</span>
                <span style={{fontSize: '0.7rem', fontWeight: activeTab === 'summary' ? 700 : 500}}>สรุปอุปนิสัย</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
