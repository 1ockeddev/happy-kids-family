'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { DailyReport, Attendance, AppUser } from '@/types';
import { useUserApp } from '@/components/UserAppProvider';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { User } from '@/components/icons';
import { usePageTracking } from '@/lib/useAnalytics';
import NotRegistered from '@/components/home/NotRegistered';
import ContributionGraph from '@/components/home/ContributionGraph';
import BehaviorSummary from '@/components/home/BehaviorSummary';
import FoodStatsSummary from '@/components/home/FoodStatsSummary';
import DailyReportView from '@/components/home/DailyReportView';
import { BehaviorScore, DayEntry, FoodSummary, BehaviorSummaryItem, AllBehaviorScore } from '@/components/home/types';
import { thDate } from '@/components/home/helpers';

/* ── Main Component ─────────────────────────────── */
function LiffPageContent() {
  const liff = useLiff();
  const pathname = usePathname();
  const activeTab = pathname === '/summary-behavior' ? 'summary' : 'daily';

  // Track page views
  usePageTracking();

  // Get shared state from context
  const {
    currentUser,
    children,
    parents,
    childId,
    parentId,
    childLoading,
    enrollmentPeriod,
    liffReady,
    notRegistered,
    cohorts,
    cohortId,
    setCohortId,
    setChildId,
    setParentId
  } = useUserApp();

  // Page-specific state
  const [dayEntries,  setDayEntries]  = useState<DayEntry[]>([]);
  const [dayIdx,      setDayIdx]      = useState(0);
  const [report,      setReport]      = useState<DailyReport|null>(null);
  const [attendance,  setAttendance]  = useState<Attendance|null>(null);
  const [scores,      setScores]      = useState<BehaviorScore[]>([]);
  const [teacher,     setTeacher]     = useState<AppUser|null>(null);
  const [childEnrollmentCohortId, setChildEnrollmentCohortId] = useState<string|null>(null);

  const [daysLoading,   setDaysLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummaryShimmer, setShowSummaryShimmer] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<{date:string;status:string}[]>([]);
  const [holidays, setHolidays] = useState<{date:string;name_th:string}[]>([]);
  const [activities, setActivities] = useState<{date:string;activity:string}[]>([]);
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorSummaryItem[]>([]);
  const [foodSummary, setFoodSummary] = useState<FoodSummary>({ 
    food: [], fruit: [], milk1: [], milk2: [], 
    nap: { total_days: 0, nap_days: 0, avg_hours: null }, 
    excretions: [] 
  });


  /* ── Handle query parameter for dayIdx ── */
  useEffect(() => {
    if (typeof window !== 'undefined' && dayEntries.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const dayIdxParam = params.get('dayIdx');
      if (dayIdxParam !== null) {
        const idx = parseInt(dayIdxParam, 10);
        if (!isNaN(idx) && idx >= 0 && idx < dayEntries.length) {
          setDayIdx(idx);
          window.history.replaceState({}, '', '/');
        }
      }
    }
  }, [dayEntries]);

  /* ── child → days ── */
  useEffect(()=>{
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); 
    setDayIdx(0); 
    setReport(null); 
    setAttendance(null); 
    setScores([]);
    setAttendanceSummary([]);
    setHolidays([]);
    setActivities([]);
    setChildEnrollmentCohortId(null);
    let cancelled = false;
    
    // Load days
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
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
          setAttendanceSummary(j.data??[]);
        }
      })
      .catch(() => {
        if (!cancelled) setAttendanceSummary([]);
      });
    
    return () => { cancelled = true; };
  },[childId]);

  /* ── Load holidays and activities based on enrollment period ── */
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    
    let cancelled = false;
    
    const endDateStr = enrollmentPeriod.end || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })();
    
    // Get cohort_id for holidays
    fetch(`/api/report/enrollment-period?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          const enrollmentCohortId = j.data?.cohort_id;
          if (enrollmentCohortId) {
            setChildEnrollmentCohortId(enrollmentCohortId);
          }
          
          // Load holidays for this period (with or without cohort_id)
          let holidaysUrl = `/api/holidays?start_date=${enrollmentPeriod.start}&end_date=${endDateStr}`;
          if (enrollmentCohortId) {
            holidaysUrl += `&cohort_id=${enrollmentCohortId}`;
          }
          fetch(holidaysUrl).then(r=>r.json())
            .then(j=>{
              if (!cancelled) setHolidays(j.data??[]);
            });
        }
      });
    
    // Load activities for this period
    fetch(`/api/report/activities?child_id=${childId}&start_date=${enrollmentPeriod.start}&end_date=${endDateStr}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) setActivities(j.data??[]);
      });
    
    return () => { cancelled = true; };
  }, [childId, enrollmentPeriod]);

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
          // Data is loaded but not used in current view
          // Can be used for detailed analysis or charts in future
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
    const maxAttempts = 20;
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
        // Get parent week column to calculate correct offset
        const weekColumn = selectedElement.parentElement;
        if (!weekColumn) return;
        
        const containerRect = container.getBoundingClientRect();
        const weekColumnOffsetLeft = weekColumn.offsetLeft;
        
        // Calculate scroll position to center the week column
        const scrollLeft = weekColumnOffsetLeft - (containerRect.width / 2) + (weekColumn.offsetWidth / 2);
        
        // Use scrollTo for better mobile support
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      } catch (error) {
        // Fallback for older browsers
        try {
          const weekColumn = selectedElement.parentElement;
          if (weekColumn) {
            container.scrollLeft = weekColumn.offsetLeft - (container.clientWidth / 2);
          }
        } catch (e) {
          // Silent fail
        }
      }
    };
    
    // Start scrolling attempt with delay to ensure DOM is ready
    timerId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToSelectedDate);
      });
    }, 250);
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [dayIdx, currentEntry?.date]); // เปลี่ยนเป็น currentEntry?.date แทน เพื่อป้องกัน re-render บ่อย

  /* ── loading ── */
  if (!liffReady) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'#f8fafc'}}>
      <div style={{width:40,height:40,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notRegistered && !childLoading) {
    return <NotRegistered lineId={liff.profile?.userId || 'ไม่พบ LINE ID'} />;
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
        <AppHeader
          parents={parents}
          children={children}
          parentId={parentId}
          childId={childId}
          childLoading={childLoading}
          currentUser={currentUser}
          onParentSelect={setParentId}
          onChildSelect={setChildId}
          cohorts={cohorts}
          cohortId={cohortId}
          onCohortSelect={setCohortId}
          subtitle={selectedChild && currentEntry ? thDate(currentEntry.date) : selectedChild ? 'รอลงข้อมูล' : undefined}
        />

        {/* ─── CONTRIBUTION GRAPH ─────────────────── */}
        {!childLoading && childId && activeTab === 'daily' && enrollmentPeriod && (
          <ContributionGraph
            attendanceSummary={attendanceSummary}
            dayEntries={dayEntries}
            enrollmentPeriod={enrollmentPeriod}
            holidays={holidays}
            activities={activities}
            dayIdx={dayIdx}
            onDaySelect={setDayIdx}
          />
        )}

        {/* ─── BEHAVIOR SUMMARY & FOOD STATS ─────────────────────────────── */}
        {!childLoading && childId && activeTab === 'summary' && (
          <>
            <BehaviorSummary
              behaviorSummary={behaviorSummary}
              summaryLoading={summaryLoading}
              showSummaryShimmer={showSummaryShimmer}
              childId={childId}
              enrollmentPeriod={enrollmentPeriod}
              dayEntries={dayEntries}
              onDaySelect={setDayIdx}
            />
            <FoodStatsSummary foodSummary={foodSummary} />
          </>
        )}
        {/* ─── DAILY REPORT CONTENT ────────────────────────────── */}
        {activeTab === 'daily' && childId && (
          <div style={{ padding: '16px 16px 0' }}>
            <DailyReportView
              report={report}
              attendance={attendance}
              scores={scores}
              teacher={teacher}
              currentEntry={currentEntry}
              reportLoading={reportLoading}
              behaviorGroups={behaviorGroups}
            />
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

        {/* ─── BOTTOM NAVIGATION BAR ─────────────────────────────── */}
        {!childLoading && childId && <BottomNavigation />}
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
                <User size={16} color={localStorage.getItem('mockRole') === 'teacher' ? 'white' : '#64748b'} /> Teacher Mode
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

/* ── Export main component (UserAppProvider is now in layout) ── */
export default LiffPageContent;
