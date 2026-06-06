'use client';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, AppUser, MilkStatus, DailyReport } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import BehaviorCardSkeleton from '@/components/loading/skeletons/BehaviorCardSkeleton';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

const amtL: Record<MilkStatus,string> = { all:'ทานหมด', some:'ทานครึ่งเดียว', not_must:'ไม่จำเป็น', skip:'ไม่ทาน' };

interface BehaviorSummaryItem {
  item_id:string;
  name_th:string;
  category_name_th:string;
  avg_score:number;
  max_score:number;
  daily_scores:{date:string;score:number}[];
  days_recorded:number;
}

interface DayEntry { date:string; daily_id:string; report_id:string|null }

const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function SummaryPage() {
  const liff = useLiff();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [parents,  setParents]  = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId,  setChildId]  = useState<string|null>(null);
  const hasRestoredParent = React.useRef(false);
  const hasInitialized = React.useRef(false);
  const [childLoading,  setChildLoading]  = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<{start:string;end:string|null}|null>(null);
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorSummaryItem[]>([]);
  const [dayEntries,  setDayEntries]  = useState<DayEntry[]>([]);
  const [foodSummary, setFoodSummary] = useState<{
    food: { food_amount: MilkStatus; count: number }[];
    fruit: { fruit_amount: MilkStatus; count: number }[];
  }>({ food: [], fruit: [] });

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
        setNotRegistered(true);
        return;
      }
      const user = regJson.data;
      setCurrentUser(user);
      
      if (user?.role === 'teacher') {
        const childRes = await fetch('/api/children');
        const childJson = await childRes.json();
        setChildren(childJson.data ?? []);
      } else {
        const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
        const childJson = await childRes.json();
        const kids:Child[] = childJson.data??[];
        setChildren(kids);
        if (kids.length===0) setNotRegistered(true);
      }
    })
    .catch(()=>setNotRegistered(true))
    .finally(()=>setChildLoading(false));
  },[liff.ready,liff.profile?.userId]);

  useEffect(()=>{
    if (children.length > 0 && !childId) {
      const savedChildId = localStorage.getItem('selectedChildId');
      if (savedChildId && children.find(c => c.id === savedChildId)) {
        setChildId(savedChildId);
      } else {
        setChildId(children[0].id);
      }
    }
  },[children, childId]);

  useEffect(() => {
    if (childId) {
      localStorage.setItem('selectedChildId', childId);
    }
  }, [childId]);

  /* ── child → parents ── */
  useEffect(()=>{
    if (currentUser?.role === 'teacher' && !childId) {
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
          
          const savedParentId = localStorage.getItem('selectedParentId');
          if (savedParentId && parentsList.find((p: AppUser) => p.id === savedParentId)) {
            setParentId(savedParentId);
          }
          
          hasInitialized.current = true;
        }
      });
    return () => { cancelled = true; };
  },[childId, currentUser]);

  useEffect(() => {
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
    let cancelled = false;
    
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) setDayEntries(j.data??[]);
      });
    
    fetch(`/api/report/enrollment-period?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled && j.data?.start_date) {
          setEnrollmentPeriod({
            start: j.data.start_date,
            end: j.data.end_date
          });
        }
      });
    
    return () => { cancelled = true; };
  },[childId]);

  /* ── Load behavior and food summary ── */
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    
    let cancelled = false;
    setDataLoading(true);
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFrom = enrollmentPeriod.start;
    const dateTo = enrollmentPeriod.end || todayStr;
    
    fetch(`/api/report/behavior-summary?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
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
            setShowShimmer(true);
            setTimeout(() => setShowShimmer(false), 300);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    
    fetch(`/api/report/food-summary?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          setFoodSummary({
            food: j.data?.food || [],
            fruit: j.data?.fruit || []
          });
        }
      });
    
    return () => { cancelled = true; };
  }, [childId, enrollmentPeriod]);

  const selectedChild = children.find(c=>c.id===childId);

  if (!liff.ready) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'#f8fafc'}}>
      <div style={{width:40,height:40,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  if (notRegistered&&!childLoading) {
    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#f8fafc'}}>
        <div style={{background:'white',borderRadius:20,padding:28,textAlign:'center',maxWidth:340,border:'1px solid #e2e8f0',boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 12px'}}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h2 style={{fontWeight:800,color:'#0f172a',marginBottom:8}}>ยังไม่มีข้อมูล</h2>
          <p style={{fontSize:14,color:'#64748b',lineHeight:1.6}}>
            LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:'#f8fafc',minHeight:'100dvh',display:'flex',justifyContent:'center'}}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
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
          subtitle={enrollmentPeriod ? `${parseLocalDate(enrollmentPeriod.start).toLocaleDateString('th-TH')} - ${enrollmentPeriod.end ? parseLocalDate(enrollmentPeriod.end).toLocaleDateString('th-TH') : 'ปัจจุบัน'}` : undefined}
        />

        {/* ─── BEHAVIOR SUMMARY ─────────────────────────────── */}
        {!childLoading && childId && (
          <LoadingWrapper
            isLoading={dataLoading}
            hasData={behaviorSummary.length > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod}
            shimmerComponent={<BehaviorCardSkeleton />}
          >
            <div style={{padding:'16px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <div style={{fontSize:'0.7rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'flex',alignItems:'center',gap:6}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fbbf24"/>
                  </svg>
                  สรุปอุปนิสัย
                </div>
                <span style={{fontSize:'0.6rem',color:'#94a3b8'}}>
                  คะแนนเฉลี่ยตลอดช่วงเรียน
                </span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {(() => {
                const grouped = behaviorSummary.reduce<Record<string, typeof behaviorSummary>>((acc, item) => {
                  if (!acc[item.category_name_th]) acc[item.category_name_th] = [];
                  acc[item.category_name_th].push(item);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([categoryName, items]) => (
                  <div key={categoryName} style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{fontSize:'0.7rem',fontWeight:700,color:'#6366f1',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      {categoryName}
                    </div>
                    {items.map((item) => {
                      const percentage = (item.avg_score / item.max_score) * 100;
                      const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
                      
                      return (
                        <div key={item.item_id} style={{display:'flex',flexDirection:'column',gap:6,paddingLeft:8,background:'#fafafa',padding:12,borderRadius:10}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'0.75rem',fontWeight:600,color:'#475569'}}>{item.name_th}</span>
                          </div>
                          
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
                                    const foundIdx = dayEntries.findIndex(entry => entry.date === day.date);
                                    if (foundIdx >= 0) {
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

        {/* ─── BOTTOM NAVIGATION ─────────────────────────────── */}
        <BottomNavigation />
      </div>
    </div>
  );
}
