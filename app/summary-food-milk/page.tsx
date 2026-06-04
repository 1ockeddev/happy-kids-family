'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, AppUser, MilkStatus } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import FoodSummarySkeleton from '@/components/loading/skeletons/FoodSummarySkeleton';

const amtL: Record<MilkStatus,string> = { all:'ทานหมด', some:'ทานครึ่งเดียว', not_must:'ไม่จำเป็น', skip:'ไม่ทาน' };

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

export default function FoodMilkSummaryPage() {
  const liff = useLiff();
  const router = useRouter();
  const [parents, setParents] = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId, setChildId] = useState<string|null>(null);
  const hasRestoredParent = React.useRef(false);
  const hasInitialized = React.useRef(false);
  const [childLoading, setChildLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<{start:string;end:string|null}|null>(null);
  const [foodSummary, setFoodSummary] = useState<{
    food: { food_amount: MilkStatus; count: number }[];
    fruit: { fruit_amount: MilkStatus; count: number }[];
    milk1: { milk_amount: MilkStatus; count: number }[];
    milk2: { milk_amount: MilkStatus; count: number }[];
  }>({ food: [], fruit: [], milk1: [], milk2: [] });

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

  /* ── child → enrollment & data ── */
  useEffect(()=>{
    if (!childId) return;
    let cancelled = false;
    
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

  /* ── Load food summary ── */
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    
    let cancelled = false;
    setDataLoading(true);
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFrom = enrollmentPeriod.start;
    const dateTo = enrollmentPeriod.end || todayStr;
    
    fetch(`/api/report/food-summary?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          const summary = {
            food: j.data?.food || [],
            fruit: j.data?.fruit || [],
            milk1: j.data?.milk1 || [],
            milk2: j.data?.milk2 || []
          };
          setFoodSummary(summary);
          
          // Show shimmer briefly if has data
          const hasData = summary.food.length > 0 || summary.fruit.length > 0 || 
                         summary.milk1.length > 0 || summary.milk2.length > 0;
          if (hasData) {
            setShowShimmer(true);
            setTimeout(() => setShowShimmer(false), 300);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
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

        {/* Content */}
        <div style={{padding:'16px'}}>
          {enrollmentPeriod && (
            <div style={{marginBottom:16}}>
              <span style={{fontSize:'0.6rem',color:'#94a3b8'}}>
                ตลอดช่วงเรียน: {new Date(enrollmentPeriod.start).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})}
                {' - '}
                {enrollmentPeriod.end ? new Date(enrollmentPeriod.end).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}) : 'ปัจจุบัน'}
              </span>
            </div>
          )}

          <LoadingWrapper
            isLoading={dataLoading}
            hasData={foodSummary.food.length > 0 || foodSummary.fruit.length > 0 || 
                     foodSummary.milk1.length > 0 || foodSummary.milk2.length > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod} // Wait for both child and enrollment period
            shimmerComponent={<FoodSummarySkeleton />}
          >
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <>
            {/* Food Statistics */}
            {foodSummary.food?.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                    <path d="M7 2v20"/>
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                  </svg>
                  อาหารกลางวัน
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {foodSummary.food.map(item => (
                    <div key={item.food_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'0.8rem',color:'#64748b'}}>{amtL[item.food_amount]}</span>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{
                          height:8,
                          width:Math.max(40, (item.count / Math.max(...foodSummary.food.map(f => f.count))) * 150),
                          background:item.food_amount==='all'?'#10b981':item.food_amount==='some'?'#f59e0b':'#94a3b8',
                          borderRadius:4
                        }}/>
                        <span style={{fontSize:'0.85rem',fontWeight:700,color:'#1e293b',minWidth:50,textAlign:'right'}}>{item.count} ครั้ง</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fruit Statistics */}
            {foodSummary.fruit?.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <svg width="20" height="20" viewBox="0 0 512 512" fill="none" stroke="#ef4444" strokeWidth="20">
                    <path d="M445.618,228.059h-42.029l27.986-43.14c1.954-3.012,1.096-7.037-1.916-8.991c-3.011-1.953-7.036-1.097-8.99,1.916l-32.576,50.215h-70.124c-2.758-63.71-45.818-114.503-98.357-114.503c-46.697,0-86.652,40.321-96.29,95.396C95.139,188.996,75.1,164.417,70.731,143.56c-1.033-4.947-4.933-8.683-9.936-9.518c-4.923-0.823-9.735,1.366-12.333,5.579c-0.116,0.18-0.21,0.344-0.287,0.487c-8.978,15.282-11.588,33.751-7.811,52.788c-4.686-4.875-8.418-9.9-10.996-14.962c-2.297-4.498-7.044-7.077-12.088-6.572c-5.022,0.502-9.144,3.953-10.5,8.801l-0.047,0.17c-7.67,27.815,2.96,57.899,27.076,81.47c-5.247-2.475-9.847-5.33-13.638-8.552c-3.893-3.31-9.313-3.891-13.809-1.481c-4.399,2.358-6.863,7.083-6.276,12.036l0.034,0.276c2.977,23.833,18.146,44.562,42.713,58.368c18.833,10.583,41.506,16.112,65.323,16.111c6.442,0,12.972-0.405,19.526-1.223c15.844-1.979,30.252-5.563,42.955-10.496c14.35,7.672,31.206,11.714,48.975,11.714c26.114,0,49.632-8.628,66.982-24.424c16.946,15.588,39.94,24.427,67.025,24.427c58.916,0,98.5-41.794,98.5-104C452.118,230.969,449.208,228.059,445.618,228.059z M201.131,133.386c0,0.477-2,2.5-6,2.5c-3.508,0-5.476-1.555-5.908-2.259c2.088-1.007,4.215-1.91,6.375-2.711C199.273,131.07,201.131,132.928,201.131,133.386z" fill="#ef4444" opacity="0.3"/>
                    <path d="M234.036,135.066c-10.654,0-19,6.808-19,15.5s8.346,15.5,19,15.5s19-6.808,19-15.5S244.69,135.066,234.036,135.066z M234.036,153.066c-4,0-6-2.023-6-2.5s2-2.5,6-2.5s6,2.023,6,2.5S238.036,153.066,234.036,153.066z" fill="#ef4444" opacity="0.3"/>
                  </svg>
                  ผลไม้
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {foodSummary.fruit.map(item => (
                    <div key={item.fruit_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'0.8rem',color:'#64748b'}}>{amtL[item.fruit_amount]}</span>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{
                          height:8,
                          width:Math.max(40, (item.count / Math.max(...foodSummary.fruit.map(f => f.count))) * 150),
                          background:item.fruit_amount==='all'?'#10b981':item.fruit_amount==='some'?'#f59e0b':'#94a3b8',
                          borderRadius:4
                        }}/>
                        <span style={{fontSize:'0.85rem',fontWeight:700,color:'#1e293b',minWidth:50,textAlign:'right'}}>{item.count} ครั้ง</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Milk1 Statistics */}
            {foodSummary.milk1?.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z"/>
                    <path d="M6 6h12"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                  นม มื้อ 1
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {foodSummary.milk1.map(item => (
                    <div key={item.milk_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'0.8rem',color:'#64748b'}}>{amtL[item.milk_amount]}</span>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{
                          height:8,
                          width:Math.max(40, (item.count / Math.max(...foodSummary.milk1.map(f => f.count))) * 150),
                          background:item.milk_amount==='all'?'#10b981':item.milk_amount==='some'?'#f59e0b':'#94a3b8',
                          borderRadius:4
                        }}/>
                        <span style={{fontSize:'0.85rem',fontWeight:700,color:'#1e293b',minWidth:50,textAlign:'right'}}>{item.count} ครั้ง</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Milk2 Statistics */}
            {foodSummary.milk2?.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z"/>
                    <path d="M6 6h12"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                  นม มื้อ 2
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {foodSummary.milk2.map(item => (
                    <div key={item.milk_amount} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'0.8rem',color:'#64748b'}}>{amtL[item.milk_amount]}</span>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{
                          height:8,
                          width:Math.max(40, (item.count / Math.max(...foodSummary.milk2.map(f => f.count))) * 150),
                          background:item.milk_amount==='all'?'#10b981':item.milk_amount==='some'?'#f59e0b':'#94a3b8',
                          borderRadius:4
                        }}/>
                        <span style={{fontSize:'0.85rem',fontWeight:700,color:'#1e293b',minWidth:50,textAlign:'right'}}>{item.count} ครั้ง</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </>
            </div>
          </LoadingWrapper>
        </div>

        {/* Bottom Navigation */}
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
            onClick={() => router.push('/summary-behavior')}
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
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:500}}>อุปนิสัย</span>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
              <path d="M7 2v20"/>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:700}}>อาหาร นม</span>
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
