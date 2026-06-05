'use client';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, DailyReport, Attendance, MilkStatus, ExcretionType, ExcretionAction, AppUser } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import BehaviorCardSkeleton from '@/components/loading/skeletons/BehaviorCardSkeleton';

/* ── label maps ─────────────────────────────── */
const amtL: Record<MilkStatus,string> = { all:'ทานหมด', some:'ทานครึ่งเดียว', not_must:'ไม่จำเป็น', skip:'ไม่ทาน' };
const amtStyle: Record<MilkStatus,{bg:string;color:string}> = {
  all:      {bg:'#dcfce7',color:'#15803d'},
  some:     {bg:'#fef3c7',color:'#b45309'},
  not_must: {bg:'#dbeafe',color:'#1e40af'},
  skip:     {bg:'#ffe4e6',color:'#9f1239'},
};
const attL:  Record<string,string> = { present:'มาเรียน', absent:'ขาดเรียน', sick:'ป่วย', leave:'ลา' };
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
  const dayEntriesMap = new Map(dayEntries.map((entry, idx) => [entry.date, { idx, hasReport: !!entry.report_id }]));
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
      const dayEntryData = dayEntriesMap.get(dateStr);
      const dayIdx = dayEntryData?.idx ?? null;
      const hasReport = dayEntryData?.hasReport ?? false; // Has report if report_id exists
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
  const pathname = usePathname();
  const activeTab = pathname === '/summary-behavior' ? 'summary' : 'daily';

  const [parents,  setParents]  = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId,  setChildId]  = useState<string|null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser|null>(null);
  const hasRestoredParent = React.useRef(false);
  const hasInitialized = React.useRef(false);

  const [dayEntries,  setDayEntries]  = useState<DayEntry[]>([]);
  const [dayIdx,      setDayIdx]      = useState(0);
  const [report,      setReport]      = useState<DailyReport|null>(null);
  const [attendance,  setAttendance]  = useState<Attendance|null>(null);
  const [scores,      setScores]      = useState<BehaviorScore[]>([]);
  const [teacher,     setTeacher]     = useState<AppUser|null>(null);

  const [childLoading,  setChildLoading]  = useState(false);
  const [daysLoading,   setDaysLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummaryShimmer, setShowSummaryShimmer] = useState(false);
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
  const [allBehaviorScores, setAllBehaviorScores] = useState<{
    id:string;
    score:number;
    note:string|null;
    date:string;
    item_id:string;
    item_name_th:string;
    item_name_en:string;
    max_score:number;
    category_id:string;
    category_name_th:string;
    category_name_en:string;
  }[]>([]);
  const [cohortId, setCohortId] = useState<string|null>(null); // Store cohort_id from enrollment
  const [copied, setCopied] = useState(false); // For copy LINE ID button
  const [foodSummary, setFoodSummary] = useState<{
    food: { food_amount: MilkStatus; count: number }[];
    fruit: { fruit_amount: MilkStatus; count: number }[];
    milk1: { milk_amount: MilkStatus; count: number }[];
    milk2: { milk_amount: MilkStatus; count: number }[];
    nap: { total_days: number; nap_days: number; avg_hours: number | null };
    excretions: { type: ExcretionType; action: ExcretionAction; count: number }[];
  }>({ food: [], fruit: [], milk1: [], milk2: [], nap: { total_days: 0, nap_days: 0, avg_hours: null }, excretions: [] });

  /* ── LIFF ready ── */
  useEffect(() => {
    console.log('🚀 LIFF ready:', liff.ready, 'profile:', liff.profile);
    if (!liff.ready) return;
    
    // Development mode: No LINE profile (local testing)
    if (!liff.profile?.userId) {
      console.log('⚠️ Development mode - No LINE profile');
      
      // Check localStorage for mock role
      const mockRole = localStorage.getItem('mockRole') as 'teacher' | 'parent' | null;
      console.log('🔧 Mock role from localStorage:', mockRole);
      
      if (mockRole === 'teacher') {
        console.log('👨‍🏫 Dev mode: Teacher - Loading all children');
        const mockUser: AppUser = {
          id: 'dev-teacher-id',
          line_user_id: null,
          role: 'teacher',
          status: 'active',
          display_name: 'Dev Teacher',
          line_display_name: null,
          picture_url: null,
          created_at: new Date().toISOString()
        };
        setCurrentUser(mockUser);
        
        fetch('/api/children').then(r=>r.json()).then(j=>{
          const kids: Child[] = j.data ?? [];
          console.log('👶 Dev mode: Children loaded:', kids.length);
          setChildren(kids);
        });
      } else {
        // Default: load children with reports (parent view)
        console.log('👪 Dev mode: Parent - Loading children with reports');
        fetch('/api/report/children').then(r=>r.json()).then(j=>{
          setChildren(j.data??[]);
        });
      }
      return;
    }
    
    console.log('📱 LINE userId:', liff.profile.userId, 'displayName:', liff.profile.displayName);
    setChildLoading(true);
    fetch('/api/auth/line-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line_user_id:liff.profile.userId,display_name:liff.profile.displayName,picture_url:liff.profile.pictureUrl??null})})
    .then(r=>r.json())
    .then(async regJson => {
      console.log('📦 API Response:', regJson);
      if (regJson.status === 403) {
        setNotRegistered(true);  // แสดงหน้า "ติดต่อครู"
        return;
      }
      const user = regJson.data;
      console.log('👤 User data:', user);
      setCurrentUser(user);
      console.log('🔍 User role:', user?.role);
      
      // ถ้าเป็น teacher → โหลดเด็กทั้งหมด
      if (user?.role === 'teacher') {
        console.log('👨‍🏫 Teacher mode: Loading all children');
        const childRes = await fetch('/api/children');
        const childJson = await childRes.json();
        const kids: Child[] = childJson.data ?? [];
        console.log('👶 Children loaded:', kids.length, kids);
        setChildren(kids);
        if (kids.length === 0) setNotRegistered(true);
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
      // Try to restore from localStorage first
      const savedChildId = localStorage.getItem('selectedChildId');
      if (savedChildId && children.find(c => c.id === savedChildId)) {
        setChildId(savedChildId);
      } else {
        setChildId(children[0].id);
      }
    }
  },[children, childId]);

  // Save childId to localStorage whenever it changes
  useEffect(() => {
    if (childId) {
      localStorage.setItem('selectedChildId', childId);
    }
  }, [childId]);

  /* ── child → parents ── */
  useEffect(()=>{
    // Teachers don't need to load parents
    if (currentUser?.role === 'teacher') {
      setParents([]);
      setParentId(null);
      return;
    }
    
    if (!childId) { 
      setParents([]); 
      setParentId(null); 
      hasRestoredParent.current = false;
      return; 
    }
    let cancelled = false;
    fetch(`/api/report/child-parents?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          const parentsList = j.data ?? [];
          setParents(parentsList);
          
          // Always try to restore parentId from localStorage when parents list is loaded
          const savedParentId = localStorage.getItem('selectedParentId');
          if (savedParentId && parentsList.find((p: AppUser) => p.id === savedParentId)) {
            setParentId(savedParentId);
          }
          
          // Mark as initialized after first restore attempt
          hasInitialized.current = true;
        }
      });
    return () => { cancelled = true; };
  },[childId, currentUser]);

  // Save parentId to localStorage whenever it changes
  useEffect(() => {
    // Don't save until we've tried to restore at least once
    if (!hasInitialized.current) return;
    
    if (parentId) {
      localStorage.setItem('selectedParentId', parentId);
    } else {
      localStorage.removeItem('selectedParentId');
    }
  }, [parentId]);

  /* ── child → days ── */
  useEffect(()=>{
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); 
    setDayIdx(0); 
    setReport(null); 
    setAttendance(null); 
    setScores([]);
    setEnrollmentPeriod(null);
    setAttendanceSummary([]);
    setHolidays([]);
    setActivities([]);
    setCohortId(null);
    let cancelled = false;
    
    // Load days
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          const withReports = (j.data ?? []).filter((e: any) => e.report_id);
          const withoutReports = (j.data ?? []).filter((e: any) => !e.report_id);
          setDayEntries(j.data??[]);
        }
      })
      .finally(()=>{
        if (!cancelled) setDaysLoading(false);
      });
    
    // Load attendance summary for contribution graph
    fetch(`/api/report/attendance-summary?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          const present = (j.data ?? []).filter((d: any) => d.status === 'present');
          const others = (j.data ?? []).filter((d: any) => d.status !== 'present');
          setAttendanceSummary(j.data??[]);
        }
      })
      .catch(() => {
        if (!cancelled) setAttendanceSummary([]);
      });
    
    // Load enrollment period
    fetch(`/api/report/enrollment-period?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          if (j.data?.start_date) {
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
          } else {
            // ไม่มี enrollment period - reset ทุกอย่าง
            setEnrollmentPeriod(null);
            setCohortId(null);
            setHolidays([]);
            setActivities([]);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnrollmentPeriod(null);
          setCohortId(null);
          setHolidays([]);
          setActivities([]);
        }
      });
    
    return () => { cancelled = true; };
  },[childId]);

  /* ── Load behavior summary for entire enrollment period ── */
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    
    let cancelled = false;
    setSummaryLoading(true);
    
    // Always use full enrollment period
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFrom = enrollmentPeriod.start;
    const dateTo = enrollmentPeriod.end || todayStr;
    
    // Load summary data for sparklines
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
          
          // Show shimmer briefly if has data
          if (items.length > 0) {
            setShowSummaryShimmer(true);
            setTimeout(() => setShowSummaryShimmer(false), 300);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    
    // Load all behavior scores
    fetch(`/api/report/behavior-scores-all?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          setAllBehaviorScores(j.data ?? []);
        }
      });
    
    // Load food summary
    fetch(`/api/report/food-summary?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          setFoodSummary(j.data ?? { food: [], fruit: [], milk1: [], milk2: [], nap: { total_days: 0, nap_days: 0, avg_hours: null }, excretions: [] });
        }
      })
      .catch(err => {
        console.error('Error loading food summary:', err);
      });
    
    return () => { cancelled = true; };
  }, [childId, enrollmentPeriod]);

  /* ── day → report ── */
  useEffect(()=>{
    const entry = dayEntries[dayIdx];
    if (!entry||!childId){
      setReport(null);
      setAttendance(null);
      setScores([]);
      setReportLoading(false); // ✅ หยุด loading เมื่อไม่มี entry
      return;
    }
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
  
  // Development mode: Toggle role (only on localhost)
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  
  useEffect(() => {
    // Only show dev mode on localhost AND without LINE profile
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.endsWith('.local'));
    setIsDevelopment(isLocalhost && !liff.profile?.userId);
  }, [liff.profile?.userId]);

  /* ── Auto-scroll to selected date in calendar ── */
  useEffect(() => {
    if (!currentEntry || dayEntries.length === 0) return;
    
    let attempts = 0;
    const maxAttempts = 15;
    let timerId: NodeJS.Timeout;
    
    const scrollToSelectedDate = () => {
      const selectedElement = document.querySelector(`[data-day-date="${currentEntry.date}"]`) as HTMLElement;
      const container = document.getElementById('calendar-scroll-container');
      
      if (!selectedElement || !container) {
        // Retry if element not found yet (up to maxAttempts)
        if (attempts < maxAttempts) {
          attempts++;
          timerId = setTimeout(scrollToSelectedDate, 150);
        }
        return;
      }
      
      try {
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();
        
        // Calculate scroll position to center the selected element
        const elementOffsetLeft = selectedElement.offsetLeft;
        const scrollLeft = elementOffsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
        
        // Use scrollTo for better mobile support
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      } catch (error) {
        // Fallback for older browsers
        try {
          const elementOffsetLeft = selectedElement.offsetLeft;
          container.scrollLeft = elementOffsetLeft - (container.clientWidth / 2);
        } catch (e) {
          // Silent fail
        }
      }
    };
    
    // Start scrolling attempt immediately
    timerId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToSelectedDate);
      });
    }, 100);
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [dayIdx, currentEntry, dayEntries, childId, enrollmentPeriod, attendanceSummary]);

  /* ── loading ── */
  if (!liff.ready) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'#f8fafc'}}>
      <div style={{width:40,height:40,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notRegistered&&!childLoading) {
    const lineId = liff.profile?.userId || 'ไม่พบ LINE ID';
    
    const handleCopy = () => {
      navigator.clipboard.writeText(lineId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
    
    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#f8fafc'}}>
        <div style={{background:'white',borderRadius:20,padding:28,textAlign:'center',maxWidth:340,border:'1px solid #e2e8f0',boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
          <p style={{fontSize:48,marginBottom:12}}>🏫</p>
          <h2 style={{fontWeight:800,color:'#0f172a',marginBottom:8}}>ยังไม่มีข้อมูล</h2>
          <p style={{fontSize:14,color:'#64748b',lineHeight:1.6,marginBottom:20}}>
            LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน<br/>
            กรุณาแจ้ง CODE ให้ครูเบียร์
          </p>
          
          {/* LINE ID Section */}
          <div style={{background:'#f8fafc',borderRadius:12,padding:'16px',marginBottom:16,border:'1px solid #e2e8f0'}}>
            <p style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>CODE ของคุณ</p>
            <p style={{fontSize:'0.85rem',color:'#1e293b',fontWeight:600,wordBreak:'break-all',fontFamily:'monospace',marginBottom:12}}>{lineId}</p>
            <button
              onClick={handleCopy}
              style={{
                width:'100%',
                padding:'10px 16px',
                background: copied ? '#10b981' : '#6366f1',
                color:'white',
                border:'none',
                borderRadius:8,
                fontSize:'0.85rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.2s',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:6,
                fontFamily:'Sarabun, sans-serif'
              }}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  คัดลอก CODE
                </>
              )}
            </button>
          </div>
          
          <p style={{fontSize:'0.75rem',color:'#94a3b8',lineHeight:1.5}}>
            📱 กดปุ่มด้านบนเพื่อคัดลอก CODE<br/>
            แล้วส่งให้ครูเบียร์เพื่อเชื่อมโยงบัญชี
          </p>
        </div>
      </div>
    );
  }

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

          {/* ─── TEACHER MODE: Child Selector (always show) ─────────────────────────────── */}
          {currentUser?.role === 'teacher' && (
            <div style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid #f1f5f9'}}>
              <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,display:'block',marginBottom:12}}>เลือกนักเรียน</span>
              <div className="avatar-row">
                {childLoading ? [1,2,3,4].map(i=><SkCircle key={i} size={48}/>) :
                  children.map(c=>(
                    <button key={c.id} type="button" onClick={()=>setChildId(c.id)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0}}>
                      <Avatar src={c.photo_url} name={c.name_th} size={48} active={childId===c.id} accentColor="#6366f1" />
                      <span style={{fontSize:'0.7rem',color:childId===c.id?'#1e293b':'#94a3b8',fontWeight:childId===c.id?700:500,transition:'all .2s',maxWidth:60,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {c.nickname_th || c.nickname_en || c.name_th || c.name_en || '?'}
                      </span>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* two-way selector (Parent Mode OR Teacher Mode with selected child) */}
          {((currentUser?.role !== 'teacher') || (currentUser?.role === 'teacher' && childId)) && (
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
              <i className="bi bi-heart-fill" style={{color:'#ff8787'}}></i>
            </div>

            {/* ฝั่งลูก/นักเรียน */}
            <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden',alignItems:'flex-end'}}>
              <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>
                {currentUser?.role === 'teacher' ? 'นักเรียน' : 'ลูก / หลาน'}
              </span>
              <div className="avatar-row" style={{justifyContent:'flex-end',direction:'rtl'}}>
                {childLoading ? [1,2,3].map(i=><SkCircle key={i} size={42}/>) :
                  (currentUser?.role === 'teacher' && childId ? 
                    // Teacher mode: แสดงแค่นักเรียนที่เลือก
                    children.filter(c => c.id === childId).map(c=>(
                      <button key={c.id} type="button" onClick={()=>setChildId(c.id)}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                        <Avatar src={c.photo_url} name={c.name_th} size={42} active={true} accentColor="#6366f1" />
                        <div style={{width:4,height:4,borderRadius:'50%',background:'#6366f1',transition:'all .2s'}} />
                      </button>
                    ))
                    :
                    // Parent mode: แสดงลูกทั้งหมด
                    children.map(c=>(
                      <button key={c.id} type="button" onClick={()=>setChildId(c.id)}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                        <Avatar src={c.photo_url} name={c.name_th} size={42} active={childId===c.id} accentColor="#6366f1" />
                        <div style={{width:4,height:4,borderRadius:'50%',background:childId===c.id?'#6366f1':'transparent',transition:'all .2s'}} />
                      </button>
                    ))
                  )
                }
              </div>
            </div>
          </div>
          )}

          {/* title zone — center */}
          <div style={{textAlign:'center',marginTop:4}}>
            {/* แสดงชื่อผู้ปกครองเมื่อมีการเลือก (ทั้ง parent และ teacher mode) */}
            {(currentUser?.role !== 'teacher' || (currentUser?.role === 'teacher' && childId)) && (
              <p style={{margin:'0 0 4px',fontSize:'0.78rem',fontWeight:600,color:'#f472b6',transition:'all .2s'}}>
                {parents.find(p=>p.id===parentId)?.display_name ?? '\u00A0'}
              </p>
            )}
            {childLoading ? (
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',marginTop:4}}>
                <SkRow w={160} h={22} /><SkRow w={200} h={14} />
              </div>
            ) : (
              <>
                <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#0f172a',letterSpacing:'-0.3px'}}>
                  {selectedChild?.name_th ?? (currentUser?.role === 'teacher' ? selectedChild?.nickname_en || 'เลือกนักเรียน' : 'เลือกบุตรหลาน')}
                </h1>
                {selectedChild && currentEntry ? (
                  <div style={{display:'inline-block',marginTop:10,padding:'4px 14px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:100}}>
                    <p style={{margin:0,fontSize:'0.8rem',color:'#64748b',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                      <i className="bi bi-calendar3" style={{color:'#6366f1'}}></i>
                      {thDate(currentEntry.date)}
                    </p>
                  </div>
                ) : selectedChild ? (
                  <div style={{display:'inline-block',marginTop:10,padding:'4px 14px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:100}}>
                    <p style={{margin:0,fontSize:'0.8rem',color:'#64748b',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                      รอลงข้อมูล
                    </p>
                  </div>
                ) : (
                  <p style={{margin:'10px 0 0',fontSize:'0.75rem',color:'#94a3b8',fontWeight:500}}>
                    {currentUser?.role === 'teacher' ? 'กรุณาเลือกนักเรียน' : 'กรุณาเลือกบุตรหลาน'}
                  </p>
                )}
              </>
            )}
          </div>
        </header>

        {/* ─── CONTRIBUTION GRAPH (แทน DATE STRIP) ─────────────────── */}
        {!childLoading && childId && activeTab === 'daily' && enrollmentPeriod && (
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
            <div id="calendar-scroll-container" style={{overflowX:'auto',scrollbarWidth:'none',WebkitOverflowScrolling:'touch',overflowY:'visible'}}>
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
                                    data-day-date={day.dateStr}
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
        {!childLoading && childId && activeTab === 'summary' && (
          <LoadingWrapper
            isLoading={summaryLoading}
            hasData={behaviorSummary.length > 0}
            showShimmer={showSummaryShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod} // Wait for both child and enrollment period
            shimmerComponent={<BehaviorCardSkeleton />}
          >
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
                                      router.push('/');
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
          </LoadingWrapper>
        )}

        {/* ─── FOOD & FRUIT SUMMARY ─────────────────────────────── */}
        {!childLoading && childId && activeTab === 'summary' && (
          <div style={{padding:'16px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <span style={{fontSize:'0.7rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em'}}>📊 สรุปสถิติ</span>
                <span style={{fontSize:'0.6rem',color:'#94a3b8'}}>
                  ตลอดช่วงเรียน
                </span>
              </div>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Food Statistics */}
              {foodSummary.food?.length > 0 && (
                <div style={{background:'#f8fafc',padding:12,borderRadius:10}}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:'#475569',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                      <path d="M7 2v20"/>
                      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                    </svg>
                    อาหารกลางวัน
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {foodSummary.food.map(item => (
                      <div key={item.food_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.75rem',color:'#64748b'}}>{amtL[item.food_amount]}</span>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{
                            height:6,
                            width:Math.max(20, (item.count / Math.max(...foodSummary.food.map(f => f.count))) * 100),
                            background:item.food_amount==='all'?'#10b981':item.food_amount==='some'?'#f59e0b':'#94a3b8',
                            borderRadius:3
                          }}/>
                          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b',minWidth:30,textAlign:'right'}}>{item.count} ครั้ง</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fruit Statistics */}
              {foodSummary.fruit?.length > 0 && (
                <div style={{background:'#f8fafc',padding:12,borderRadius:10}}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:'#475569',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 512 512" fill="#ef4444" opacity="0.8">
                      <path d="M445.618,228.059h-42.029l27.986-43.14c1.954-3.012,1.096-7.037-1.916-8.991c-3.011-1.953-7.036-1.097-8.99,1.916l-32.576,50.215h-70.124c-2.758-63.71-45.818-114.503-98.357-114.503c-46.697,0-86.652,40.321-96.29,95.396C95.139,188.996,75.1,164.417,70.731,143.56c-1.033-4.947-4.933-8.683-9.936-9.518c-4.923-0.823-9.735,1.366-12.333,5.579c-0.116,0.18-0.21,0.344-0.287,0.487c-8.978,15.282-11.588,33.751-7.811,52.788c-4.686-4.875-8.418-9.9-10.996-14.962c-2.297-4.498-7.044-7.077-12.088-6.572c-5.022,0.502-9.144,3.953-10.5,8.801l-0.047,0.17c-7.67,27.815,2.96,57.899,27.076,81.47c-5.247-2.475-9.847-5.33-13.638-8.552c-3.893-3.31-9.313-3.891-13.809-1.481c-4.399,2.358-6.863,7.083-6.276,12.036l0.034,0.276c2.977,23.833,18.146,44.562,42.713,58.368c18.833,10.583,41.506,16.112,65.323,16.111c6.442,0,12.972-0.405,19.526-1.223c15.844-1.979,30.252-5.563,42.955-10.496c14.35,7.672,31.206,11.714,48.975,11.714c26.114,0,49.632-8.628,66.982-24.424c16.946,15.588,39.94,24.427,67.025,24.427c58.916,0,98.5-41.794,98.5-104C452.118,230.969,449.208,228.059,445.618,228.059z M201.131,133.386c0,0.477-2,2.5-6,2.5c-3.508,0-5.476-1.555-5.908-2.259c2.088-1.007,4.215-1.91,6.375-2.711C199.273,131.07,201.131,132.928,201.131,133.386z"/>
                    </svg>
                    ผลไม้
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {foodSummary.fruit.map(item => (
                      <div key={item.fruit_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.75rem',color:'#64748b'}}>{amtL[item.fruit_amount]}</span>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{
                            height:6,
                            width:Math.max(20, (item.count / Math.max(...foodSummary.fruit.map(f => f.count))) * 100),
                            background:item.fruit_amount==='all'?'#10b981':item.fruit_amount==='some'?'#f59e0b':'#94a3b8',
                            borderRadius:3
                          }}/>
                          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b',minWidth:30,textAlign:'right'}}>{item.count} ครั้ง</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Milk1 Statistics */}
              {foodSummary.milk1?.length > 0 && (
                <div style={{background:'#f8fafc',padding:12,borderRadius:10}}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:'#475569',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z"/>
                      <path d="M6 6h12"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                    นม มื้อ 1
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {foodSummary.milk1.map(item => (
                      <div key={item.milk_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.75rem',color:'#64748b'}}>{amtL[item.milk_amount]}</span>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{
                            height:6,
                            width:Math.max(20, (item.count / Math.max(...foodSummary.milk1.map(f => f.count))) * 100),
                            background:item.milk_amount==='all'?'#10b981':item.milk_amount==='some'?'#f59e0b':'#94a3b8',
                            borderRadius:3
                          }}/>
                          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b',minWidth:30,textAlign:'right'}}>{item.count} ครั้ง</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Milk2 Statistics */}
              {foodSummary.milk2?.length > 0 && (
                <div style={{background:'#f8fafc',padding:12,borderRadius:10}}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:'#475569',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z"/>
                      <path d="M6 6h12"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                    นม มื้อ 2
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {foodSummary.milk2.map(item => (
                      <div key={item.milk_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.75rem',color:'#64748b'}}>{amtL[item.milk_amount]}</span>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{
                            height:6,
                            width:Math.max(20, (item.count / Math.max(...foodSummary.milk2.map(f => f.count))) * 100),
                            background:item.milk_amount==='all'?'#10b981':item.milk_amount==='some'?'#f59e0b':'#94a3b8',
                            borderRadius:3
                          }}/>
                          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b',minWidth:30,textAlign:'right'}}>{item.count} ครั้ง</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Nap Statistics */}
              {foodSummary.nap?.total_days > 0 && (
                <div style={{background:'#f8fafc',padding:12,borderRadius:10}}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:'#475569',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
                      <path d="M19 17a7 7 0 1 1-14 0"/>
                    </svg>
                    การนอนกลางวัน
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'0.75rem',color:'#64748b'}}>นอนทั้งหมด</span>
                      <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b'}}>{foodSummary.nap.nap_days} / {foodSummary.nap.total_days} วัน</span>
                    </div>
                    {foodSummary.nap.avg_hours !== null && (
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.75rem',color:'#64748b'}}>ระยะเวลาเฉลี่ย</span>
                        <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b'}}>
                          {Math.floor(foodSummary.nap.avg_hours)} ชม. {Math.round((foodSummary.nap.avg_hours % 1) * 60)} นาที
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Excretion Statistics */}
              {foodSummary.excretions?.length > 0 && (
                <div style={{background:'#f8fafc',padding:12,borderRadius:10}}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:'#475569',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    การขับถ่าย
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {(() => {
                      const peeTotal = foodSummary.excretions.filter(e => e.type === 'pee').reduce((sum, e) => sum + e.count, 0);
                      const pooTotal = foodSummary.excretions.filter(e => e.type === 'poo').reduce((sum, e) => sum + e.count, 0);
                      const diaperCount = foodSummary.excretions.filter(e => e.action === 'diaper').reduce((sum, e) => sum + e.count, 0);
                      const pottyCount = foodSummary.excretions.filter(e => e.action === 'potty').reduce((sum, e) => sum + e.count, 0);
                      
                      return (
                        <>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.75rem',color:'#64748b'}}>💛 ปัสสาวะ</span>
                            <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b'}}>{peeTotal} ครั้ง</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.75rem',color:'#64748b'}}>💩 อุจจาระ</span>
                            <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b'}}>{pooTotal} ครั้ง</span>
                          </div>
                          <div style={{height:1,background:'#e2e8f0',margin:'4px 0'}}/>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.75rem',color:'#64748b'}}>🩲 ผ้าอ้อม</span>
                            <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b'}}>{diaperCount} ครั้ง</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.75rem',color:'#64748b',display:'flex',alignItems:'center',gap:4}}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4"/>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                              </svg>
                              กระโถน
                            </span>
                            <span style={{fontSize:'0.75rem',fontWeight:600,color:'#1e293b'}}>{pottyCount} ครั้ง</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
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

          {!reportLoading && childId && dayEntries.length > 0 && (
            <div className="fade">

              {/* Attendance */}
              {attendance && (
                <div style={{background:attBg[attendance.status],borderRadius:16,padding:'14px 18px',marginBottom:14,display:'flex',alignItems:'center',gap:12,border:`1px solid ${attC[attendance.status]}22`}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {attendance.status==='present' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    ) : attendance.status==='sick' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"/>
                        <path d="M9 22V12h6v10"/>
                        <path d="M2 10.6L12 2l10 8.6"/>
                        <line x1="12" y1="6" x2="12" y2="8"/>
                        <line x1="12" y1="16" x2="12" y2="18"/>
                      </svg>
                    ) : attendance.status==='absent' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                    )}
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
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 12px'}}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="15" y2="17"/>
                  </svg>
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
                  <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:14,color:'#334155',gap:8,fontFamily:'Prompt, sans-serif'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                      <path d="M7 2v20"/>
                      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                    </svg>
                    อาหารและโภชนาการ
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
                          {report.food_note && (
                            <div className="food-note">
                              <i className="bi bi-chat-left-text-fill" style={{color: '#10b981', fontSize: '0.65rem', marginRight: '2px'}}></i>
                              {report.food_note}
                            </div>
                          )}
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
                          {report.fruit_note && (
                            <div className="food-note">
                              <i className="bi bi-chat-left-text-fill" style={{color: '#10b981', fontSize: '0.65rem', marginRight: '2px'}}></i>
                              {report.fruit_note}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(report.milk1!=='skip'||report.milk2!=='skip')&&(
                    <div className="milk-section">
                      <h3 className="milk-section-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:4}}>
                          <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z"/>
                          <path d="M6 6h12"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                        การดื่มนมประจำวัน
                      </h3>
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
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:16,color:'#334155',gap:8,fontFamily:'Prompt, sans-serif'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      อุปนิสัยวันนี้
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:16}}>
                      {Object.values(behaviorGroups).map(g=>(
                        <div key={g.name_th}>
                          <p style={{fontSize:'0.78rem',fontWeight:800,color:'#7c3aed',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>{g.name_th}</p>
                          <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {g.items.map(s=>{
                              // Calculate percentage
                              const percentage = (s.score / s.max_score) * 100;
                              
                              // Determine face icon and color based on percentage
                              let faceIcon: React.ReactElement;
                              let iconColor: string;
                              
                              // Universal gray style for all items
                              const bgColor = '#f8fafc';
                              const borderColor = '#e2e8f0';
                              
                              if (percentage >= 80) {
                                // ดีมาก - เขียว
                                faceIcon = <FaceHappy size={24} color="#10b981" />;
                                iconColor = '#10b981';
                              } else if (percentage >= 60) {
                                // ดี - เหลืองสด
                                faceIcon = <FaceSmile size={24} color="#facc15" />;
                                iconColor = '#facc15';
                              } else {
                                // ควรปรับปรุง - ส้มเข้ม
                                faceIcon = <FaceNeutral size={24} color="#f97316" />;
                                iconColor = '#f97316';
                              }
                              
                              return (
                                <div key={s.item_id} style={{
                                  display:'flex',
                                  alignItems:'center',
                                  justifyContent:'space-between',
                                  padding:'12px 14px',
                                  borderRadius:12,
                                  border:`1px solid ${borderColor}`,
                                  background:bgColor,
                                  gap:12
                                }}>
                                  <div style={{flexShrink:0}}>
                                    {faceIcon}
                                  </div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:'0.9rem',fontWeight:700,color:'#1e293b'}}>
                                      {s.name_th}
                                    </div>
                                    {s.note && (
                                      <div style={{
                                        fontSize:'0.75rem',
                                        color:'#475569',
                                        lineHeight:1.5,
                                        marginTop:8,
                                        padding:'8px 10px',
                                        background:'white',
                                        borderRadius:8,
                                        border:`1px dashed ${iconColor}`
                                      }}>
                                        <i className="bi bi-chat-left-text-fill" style={{color:iconColor, fontSize:'0.7rem',marginRight:'6px'}}></i>
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
                )}

                {/* Nap */}
                <div style={{background:'white',borderRadius:16,padding:'20px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',color:'#334155',gap:8,marginBottom:0,fontFamily:'Prompt, sans-serif'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
                        <path d="M19 17a7 7 0 1 1-14 0"/>
                      </svg>
                      การนอนกลางวัน
                    </div>
                    {report.nap_from&&report.nap_to&&(
                      <div style={{textAlign:'right'}}>
                        <span style={{display:'block',fontSize:'1.1rem',fontWeight:800,color:'#1e1b4b'}}>
                          {(()=>{const d=(new Date('2000-01-01T'+report.nap_to).getTime()-new Date('2000-01-01T'+report.nap_from).getTime())/60000;return `${Math.floor(d/60)} ชม. ${d%60} นาที`;})()}
                        </span>
                        <span style={{fontSize:'0.75rem',color:'#818cf8',fontWeight:700}}>
                          {report.nap_from.slice(0,5)} - {report.nap_to.slice(0,5)} น.
                        </span>
                      </div>
                    )}
                  </div>
                  {report.nap_from&&report.nap_to ? (()=>{
                    const parseTime = (timeStr: string) => {
                      const [h, m] = timeStr.split(':').map(Number);
                      return { hours: h, minutes: m, totalMinutes: h * 60 + m };
                    };
                    
                    const startTime = parseTime(report.nap_from);
                    const endTime = parseTime(report.nap_to);
                    
                    // Timeline settings
                    const dayStart = 9 * 60;      // 09:00
                    const dayMid = 12 * 60;       // 12:00
                    const dayEnd = 14.5 * 60;     // 14:30
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
                      <div style={{display:'flex',alignItems:'center',gap:15}}>
                        {/* Analog Clock */}
                        <div style={{
                          width:50,
                          height:50,
                          borderRadius:'50%',
                          background:`conic-gradient(#e2e8f0 0% ${startPercent}%, #818cf8 ${startPercent}% ${startPercent + 0.5}%, #e2e8f0 ${startPercent + 0.5}% 100%)`,
                          position:'relative',
                          flexShrink:0,
                          border:'2px solid #f8fafc'
                        }}>
                          {/* Hour hand */}
                          <div style={{
                            position:'absolute',
                            top:'50%',
                            left:'50%',
                            width:'1.5px',
                            height:'20px',
                            background:'#60a5fa',
                            transform:`translate(-50%, -100%) rotate(${startAngle}deg)`,
                            transformOrigin:'bottom'
                          }}></div>
                          {/* Minute hand */}
                          <div style={{
                            position:'absolute',
                            top:'50%',
                            left:'50%',
                            width:'1.5px',
                            height:'20px',
                            background:'#60a5fa',
                            transform:`translate(-50%, -100%) rotate(${startAngle + 60}deg)`,
                            transformOrigin:'bottom'
                          }}></div>
                          {/* Center dot */}
                          <div style={{
                            position:'absolute',
                            top:'50%',
                            left:'50%',
                            transform:'translate(-50%, -50%)',
                            width:'4px',
                            height:'4px',
                            background:'#4338ca',
                            borderRadius:'50%'
                          }}></div>
                        </div>
                        
                        {/* Timeline */}
                        <div style={{flex:1,position:'relative',paddingTop:15}}>
                          {/* Top time labels */}
                          <div style={{position:'absolute',top:0,width:'100%',fontSize:'0.65rem',color:'#94a3b8',fontWeight:700}}>
                            <span style={{position:'absolute',left:0,transform:'translateX(-50%)'}}>09:00</span>
                            <span style={{position:'absolute',left:`${bgLeftPercent}%`,transform:'translateX(-50%)'}}>12:00</span>
                            <span style={{position:'absolute',right:0,transform:'translateX(50%)'}}>14:30</span>
                          </div>
                          
                          {/* Timeline bar */}
                          <div style={{width:'100%',height:10,background:'#f1f5f9',borderRadius:5,position:'relative',overflow:'hidden',margin:'5px 0'}}>
                            {/* Light blue background area */}
                            <div style={{
                              position:'absolute',
                              left:`${bgLeftPercent}%`,
                              width:`${bgWidthPercent}%`,
                              height:'100%',
                              background:'#e0f2fe'
                            }}></div>
                            {/* Actual nap time (dark blue) */}
                            <div style={{
                              position:'absolute',
                              left:`${napLeftPercent}%`,
                              width:`${napWidthPercent}%`,
                              height:'100%',
                              background:'#818cf8',
                              borderRadius:5
                            }}></div>
                          </div>
                          
                          {/* Bottom labels */}
                          <div style={{position:'relative',width:'100%',height:12,fontSize:'0.6rem',fontWeight:700,color:'#cbd5e1'}}>
                            <span style={{position:'absolute',left:0,transform:'translateX(-50%)'}}>START</span>
                            <span style={{position:'absolute',left:`${napLeftPercent}%`,transform:'translateX(-50%)',color:'#4338ca'}}>
                              {report.nap_from.slice(0,5)}
                            </span>
                            <span style={{position:'absolute',left:`${napLeftPercent + napWidthPercent}%`,transform:'translateX(-50%)',color:'#4338ca'}}>
                              {report.nap_to.slice(0,5)}
                            </span>
                            <span style={{position:'absolute',left:'100%',transform:'translateX(-50%)'}}>END</span>
                          </div>
                        </div>
                      </div>
                    );
                  })() : <p style={{color:'#94a3b8',fontSize:14}}>ไม่ได้นอนกลางวัน</p>}
                </div>

                {/* Excretions */}
                {(exDiaper.length>0||exPotty.length>0)&&(
                  <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:14,color:'#334155',gap:8,fontFamily:'Prompt, sans-serif'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      การขับถ่าย
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {exDiaper.length>0&&(
                        <div style={{background:'#fff7ed',padding:14,borderRadius:14,border:'1px solid #ffedd5'}}>
                          <p style={{fontSize:'0.85rem',fontWeight:800,color:'#c2410c',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="8" width="18" height="12" rx="2"/>
                              <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                            </svg>
                            ผ้าอ้อม (Diapers)
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 11l3 3L22 4"/>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </svg>
                            นั่งกระโถน (Potty)
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
                    <p style={{fontSize:'0.7rem',fontWeight:800,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                      <i className="bi bi-chat-left-text-fill" style={{color: '#3b82f6', fontSize: '0.75rem'}}></i> 
                      ข้อความจากครู
                    </p>
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
          
          {childId && !reportLoading && dayEntries.length === 0 && !daysLoading && (
            <div style={{textAlign:'center',padding:'48px 20px',color:'#94a3b8'}}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{margin:'0 auto 10px',display:'block',color:'#cbd5e1'}}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p style={{fontSize:'0.95rem'}}>ยังไม่มีรายงานประจำวัน</p>
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
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            zIndex: 1000
          }}>
            <div style={{display: 'flex', height: 64}}>
              <button
                onClick={() => router.push('/')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: activeTab === 'daily' ? '#6366f1' : '#94a3b8',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span style={{fontSize: '0.6rem', fontWeight: activeTab === 'daily' ? 700 : 500}}>หน้าแรก</span>
                {activeTab === 'daily' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 30,
                    height: 3,
                    background: '#6366f1',
                    borderRadius: '0 0 3px 3px'
                  }} />
                )}
              </button>
              <button
                onClick={() => router.push('/summary-behavior')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: pathname === '/summary-behavior' ? '#6366f1' : '#94a3b8',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname === '/summary-behavior' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span style={{fontSize: '0.6rem', fontWeight: pathname === '/summary-behavior' ? 700 : 500}}>อุปนิสัย</span>
                {pathname === '/summary-behavior' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 30,
                    height: 3,
                    background: '#6366f1',
                    borderRadius: '0 0 3px 3px'
                  }} />
                )}
              </button>
              <button
                onClick={() => router.push('/summary-food-milk')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: pathname === '/summary-food-milk' ? '#6366f1' : '#94a3b8',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                  <path d="M7 2v20"/>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
                <span style={{fontSize: '0.6rem', fontWeight: pathname === '/summary-food-milk' ? 700 : 500}}>อาหาร นม</span>
                {pathname === '/summary-food-milk' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 30,
                    height: 3,
                    background: '#6366f1',
                    borderRadius: '0 0 3px 3px'
                  }} />
                )}
              </button>
              <button
                onClick={() => router.push('/summary-nap')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: pathname === '/summary-nap' ? '#6366f1' : '#94a3b8',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
                  <path d="M19 17a7 7 0 1 1-14 0"/>
                </svg>
                <span style={{fontSize: '0.6rem', fontWeight: pathname === '/summary-nap' ? 700 : 500}}>การนอน</span>
                {pathname === '/summary-nap' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 30,
                    height: 3,
                    background: '#6366f1',
                    borderRadius: '0 0 3px 3px'
                  }} />
                )}
              </button>
              <button
                onClick={() => router.push('/summary-excretion')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: pathname === '/summary-excretion' ? '#6366f1' : '#94a3b8',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 11h10M7 15h6"/>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span style={{fontSize: '0.6rem', fontWeight: pathname === '/summary-excretion' ? 700 : 500}}>ขับถ่าย</span>
                {pathname === '/summary-excretion' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 30,
                    height: 3,
                    background: '#6366f1',
                    borderRadius: '0 0 3px 3px'
                  }} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Development Mode Toggle */}
      {isDevelopment && (
        <div style={{position:'fixed',bottom:100,right:20,zIndex:99999}}>
          <button
            onClick={() => setShowDevMenu(!showDevMenu)}
            style={{
              width:50,
              height:50,
              borderRadius:'50%',
              background:'#6366f1',
              color:'white',
              border:'none',
              boxShadow:'0 4px 12px rgba(99,102,241,0.4)',
              cursor:'pointer',
              fontSize:'1.2rem',
              display:'flex',
              alignItems:'center',
              justifyContent:'center'
            }}
          >
            🔧
          </button>
          {showDevMenu && (
            <div style={{
              position:'absolute',
              bottom:60,
              right:0,
              background:'white',
              borderRadius:12,
              boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
              padding:16,
              minWidth:200,
              border:'1px solid #e2e8f0'
            }}>
              <p style={{margin:'0 0 12px',fontSize:'0.75rem',fontWeight:700,color:'#0f172a'}}>Dev Mode</p>
              <button
                onClick={() => {
                  localStorage.setItem('mockRole', 'teacher');
                  window.location.reload();
                }}
                style={{
                  width:'100%',
                  padding:'10px',
                  marginBottom:8,
                  background:localStorage.getItem('mockRole') === 'teacher' ? '#6366f1' : '#f1f5f9',
                  color:localStorage.getItem('mockRole') === 'teacher' ? 'white' : '#64748b',
                  border:'none',
                  borderRadius:8,
                  fontSize:'0.85rem',
                  fontWeight:600,
                  cursor:'pointer'
                }}
              >
                👨‍🏫 Teacher Mode
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('mockRole');
                  window.location.reload();
                }}
                style={{
                  width:'100%',
                  padding:'10px',
                  background:!localStorage.getItem('mockRole') ? '#6366f1' : '#f1f5f9',
                  color:!localStorage.getItem('mockRole') ? 'white' : '#64748b',
                  border:'none',
                  borderRadius:8,
                  fontSize:'0.85rem',
                  fontWeight:600,
                  cursor:'pointer'
                }}
              >
                👪 Parent Mode
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
