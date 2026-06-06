'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, AppUser } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import NapSummarySkeleton from '@/components/loading/skeletons/NapSummarySkeleton';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function NapSummaryPage() {
  const liff = useLiff();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [parents, setParents] = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId, setChildId] = useState<string|null>(null);
  const hasInitialized = React.useRef(false);
  const [childLoading, setChildLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<{start:string;end:string|null}|null>(null);
  const [napSummary, setNapSummary] = useState<{
    total_days: number;
    nap_days: number;
    avg_hours: number | null;
  }>({ total_days: 0, nap_days: 0, avg_hours: null });

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
      hasInitialized.current = false;
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

  /* ── Load nap summary ── */
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
          const napData = j.data?.nap || { total_days: 0, nap_days: 0, avg_hours: null };
          setNapSummary(napData);
          
          // Show shimmer briefly if has data
          if (napData.total_days > 0) {
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
  const napPercentage = napSummary.total_days > 0 
    ? Math.round((napSummary.nap_days / napSummary.total_days) * 100) 
    : 0;

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
            hasData={napSummary.total_days > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod} // Wait for both child and enrollment period
            shimmerComponent={<NapSummarySkeleton />}
          >
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <>
                {/* Summary Card */}
                <div style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e2e8f0',textAlign:'center'}}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 12px'}}>
                    <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
                    <path d="M19 17a7 7 0 1 1-14 0"/>
                  </svg>
                  <div style={{fontSize:'2rem',fontWeight:800,color:'#0f172a',marginBottom:8}}>
                    {napSummary.nap_days} / {napSummary.total_days}
                  </div>
                  <div style={{fontSize:'0.85rem',color:'#64748b',marginBottom:16}}>
                    วันที่นอน / ทั้งหมด
                  </div>
                  
                  {/* Percentage Bar */}
                  <div style={{width:'100%',height:12,background:'#f1f5f9',borderRadius:6,overflow:'hidden',marginBottom:8}}>
                    <div style={{
                      width:`${napPercentage}%`,
                      height:'100%',
                      background:'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      transition:'width 0.5s ease'
                    }}/>
                  </div>
                  <div style={{fontSize:'0.75rem',color:'#6366f1',fontWeight:700}}>
                    {napPercentage}% ของวันทั้งหมด
                  </div>
                </div>

                {/* Average Duration */}
                {napSummary.avg_hours !== null && (
                  <div style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      ระยะเวลาเฉลี่ย
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                      <span style={{fontSize:'2.5rem',fontWeight:800,color:'#6366f1'}}>
                        {Math.floor(napSummary.avg_hours)}
                      </span>
                      <span style={{fontSize:'1rem',color:'#64748b',fontWeight:600}}>ชั่วโมง</span>
                      <span style={{fontSize:'2.5rem',fontWeight:800,color:'#6366f1'}}>
                        {Math.round((napSummary.avg_hours % 1) * 60)}
                      </span>
                      <span style={{fontSize:'1rem',color:'#64748b',fontWeight:600}}>นาที</span>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{background:'#ecfdf5',padding:16,borderRadius:12,border:'1px solid #10b98122'}}>
                    <div style={{fontSize:'0.7rem',color:'#059669',fontWeight:600,marginBottom:6,textTransform:'uppercase'}}>นอนแล้ว</div>
                    <div style={{fontSize:'1.8rem',fontWeight:800,color:'#10b981'}}>
                      {napSummary.nap_days}
                    </div>
                    <div style={{fontSize:'0.65rem',color:'#64748b'}}>วัน</div>
                  </div>
                  <div style={{background:'#fef3c7',padding:16,borderRadius:12,border:'1px solid #f59e0b22'}}>
                    <div style={{fontSize:'0.7rem',color:'#d97706',fontWeight:600,marginBottom:6,textTransform:'uppercase'}}>ไม่นอน</div>
                    <div style={{fontSize:'1.8rem',fontWeight:800,color:'#f59e0b'}}>
                      {napSummary.total_days - napSummary.nap_days}
                    </div>
                    <div style={{fontSize:'0.65rem',color:'#64748b'}}>วัน</div>
                  </div>
                </div>
              </>
            </div>
          </LoadingWrapper>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
