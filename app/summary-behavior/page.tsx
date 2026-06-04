'use client';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, AppUser, MilkStatus, DailyReport } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import BehaviorCardSkeleton from '@/components/loading/skeletons/BehaviorCardSkeleton';

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

function Avatar({src,name,size=42,active,accentColor='#6366f1'}:{src?:string|null;name?:string|null;size?:number;active?:boolean;accentColor?:string}) {
  const initial = (name ?? '?').slice(0,1).toUpperCase();
  const colors  = ['#E8754A','#6366f1','#4A90B8','#4CAF76','#F5A623','#E85C5C','#ec4899','#34d399'];
  const bg      = colors[(initial.charCodeAt(0))%colors.length];
  return src
    ? <img src={src} alt={name||''} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:'50%',background:active?bg:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',color:active?'white':'#94a3b8',fontSize:size*0.4,fontWeight:700,border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}}>
        {initial}
      </div>;
}

const shimmer: React.CSSProperties = {
  background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:8,
};
const SkRow = ({w='100%',h=14,mb=0}:{w?:string|number;h?:number;mb?:number}) =>
  <div style={{...shimmer,width:w,height:h,marginBottom:mb}} />;
const SkCircle = ({size=40}:{size?:number}) =>
  <div style={{...shimmer,width:size,height:size,borderRadius:'50%',flexShrink:0}} />;

export default function SummaryPage() {
  const liff = useLiff();
  const router = useRouter();
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
      if (user?.role === 'teacher') {
        router.replace('/admin/users');
        return;
      }
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
  },[childId]);

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
        <header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:12}}>
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
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#ff8787',fontSize:'1.1rem',padding:'0 6px',alignSelf:'center',marginTop:10,flexShrink:0}}>
              <i className="bi bi-heart-fill" style={{color:'#ff8787'}}></i>
            </div>
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
                {selectedChild && enrollmentPeriod ? (
                  <div style={{display:'inline-block',marginTop:10,padding:'4px 14px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:100}}>
                    <p style={{margin:0,fontSize:'0.75rem',color:'#64748b',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                      <i className="bi bi-calendar-range" style={{color:'#6366f1'}}></i>
                      สรุปตลอดช่วงเรียน
                    </p>
                  </div>
                ) : selectedChild ? (
                  <p style={{margin:'10px 0 0',fontSize:'0.75rem',color:'#94a3b8',fontWeight:500}}>
                    กำลังโหลดข้อมูล...
                  </p>
                ) : (
                  <p style={{margin:'10px 0 0',fontSize:'0.75rem',color:'#94a3b8',fontWeight:500}}>
                    กรุณาเลือกบุตรหลาน
                  </p>
                )}
              </>
            )}
          </div>
        </header>

        {/* ─── BEHAVIOR SUMMARY ─────────────────────────────── */}
        {!childLoading && childId && (
          <LoadingWrapper
            isLoading={dataLoading}
            hasData={behaviorSummary.length > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod} // Wait for both child and enrollment period
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
        <nav style={{
          position:'fixed',
          bottom:0,
          left:'50%',
          transform:'translateX(-50%)',
          width:'100%',
          maxWidth:480,
          background:'rgba(255, 255, 255, 0.7)',
          backdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(226, 232, 240, 0.8)',
          display:'flex',
          justifyContent:'space-around',
          padding:'8px 0',
          paddingBottom:'calc(8px + env(safe-area-inset-bottom, 0px))',
          boxShadow:'0 -2px 10px rgba(0,0,0,0.03)',
          zIndex:1000
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              flex:1,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:2,
              background:'none',
              border:'none',
              cursor:'pointer',
              padding:'6px 4px',
              transition:'all 0.2s',
              color:'#94a3b8',
              position:'relative'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:500}}>หน้าแรก</span>
          </button>
          <button
            style={{
              flex:1,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:2,
              background:'none',
              border:'none',
              cursor:'pointer',
              padding:'6px 4px',
              transition:'all 0.2s',
              color:'#6366f1',
              position:'relative'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:700}}>อุปนิสัย</span>
            <div style={{
              position:'absolute',
              top:-6,
              left:'50%',
              transform:'translateX(-50%)',
              width:30,
              height:3,
              background:'#6366f1',
              borderRadius:'0 0 3px 3px'
            }} />
          </button>
          <button
            onClick={() => router.push('/summary-food-milk')}
            style={{
              flex:1,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:2,
              background:'none',
              border:'none',
              cursor:'pointer',
              padding:'6px 4px',
              transition:'all 0.2s',
              color:'#94a3b8',
              position:'relative'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
              <path d="M7 2v20"/>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:500}}>อาหาร นม</span>
          </button>
          <button
            onClick={() => router.push('/summary-nap')}
            style={{
              flex:1,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:2,
              background:'none',
              border:'none',
              cursor:'pointer',
              padding:'6px 4px',
              transition:'all 0.2s',
              color:'#94a3b8',
              position:'relative'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
              <path d="M19 17a7 7 0 1 1-14 0"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:500}}>การนอน</span>
          </button>
          <button
            onClick={() => router.push('/summary-excretion')}
            style={{
              flex:1,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:2,
              background:'none',
              border:'none',
              cursor:'pointer',
              padding:'6px 4px',
              transition:'all 0.2s',
              color:'#94a3b8',
              position:'relative'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11h10M7 15h6"/>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:500}}>ขับถ่าย</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
