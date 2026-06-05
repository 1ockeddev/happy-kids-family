'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, AppUser, ExcretionType, ExcretionAction } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import ExcretionSummarySkeleton from '@/components/loading/skeletons/ExcretionSummarySkeleton';
import AppHeader from '@/components/AppHeader';

const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ExcretionSummaryPage() {
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
  const [excretionSummary, setExcretionSummary] = useState<{
    type: ExcretionType;
    action: ExcretionAction;
    count: number;
  }[]>([]);

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
          const period = {
            start: j.data.start_date,
            end: j.data.end_date
          };
          setEnrollmentPeriod(period);
        }
      });
    
    return () => { cancelled = true; };
  },[childId]);

  /* ── Load excretion summary ── */
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    
    let cancelled = false;
    setDataLoading(true);
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFrom = enrollmentPeriod.start;
    const dateTo = enrollmentPeriod.end || todayStr;
    
    const apiUrl = `/api/report/food-summary?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}`;
    
    fetch(apiUrl)
      .then(r=>r.json())
      .then(j=>{
        if (!cancelled) {
          const excretions = j.data?.excretions || [];
          setExcretionSummary(excretions);
          
          // Show shimmer briefly if has data
          if (excretions.length > 0) {
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
  
  // Calculate totals - ensure count is converted to number
  const peeTotal = excretionSummary
    .filter(e => e.type === 'pee')
    .reduce((sum, e) => sum + Number(e.count), 0);
  const pooTotal = excretionSummary
    .filter(e => e.type === 'poo')
    .reduce((sum, e) => sum + Number(e.count), 0);
  const diaperCount = excretionSummary
    .filter(e => e.action === 'diaper')
    .reduce((sum, e) => sum + Number(e.count), 0);
  const pottyCount = excretionSummary
    .filter(e => e.action === 'potty')
    .reduce((sum, e) => sum + Number(e.count), 0);
  const totalCount = peeTotal + pooTotal;

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
            hasData={excretionSummary.length > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod}
            shimmerComponent={<ExcretionSummarySkeleton />}
          >
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <>
                {/* Total Summary */}
                <div style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e2e8f0',textAlign:'center'}}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 12px'}}>
                    <path d="M7 11h10M7 15h6"/>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  <div style={{fontSize:'2rem',fontWeight:800,color:'#0f172a',marginBottom:8}}>
                    {totalCount}
                  </div>
                  <div style={{fontSize:'0.85rem',color:'#64748b'}}>
                    ครั้งทั้งหมด
                  </div>
                </div>

                {/* Type Statistics */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{background:'#fef3c7',padding:20,borderRadius:16,border:'1px solid #f59e0b22',textAlign:'center'}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{margin:'0 auto 8px'}}>
                      <circle cx="12" cy="12" r="10" fill="#fbbf24"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="9" r="1" fill="#78350f"/>
                      <circle cx="15" cy="9" r="1" fill="#78350f"/>
                    </svg>
                    <div style={{fontSize:'1.8rem',fontWeight:800,color:'#f59e0b',marginBottom:4}}>
                      {peeTotal}
                    </div>
                    <div style={{fontSize:'0.75rem',color:'#64748b',fontWeight:600}}>
                      ปัสสาวะ
                    </div>
                  </div>
                  <div style={{background:'#fef2f2',padding:20,borderRadius:16,border:'1px solid #ef444422',textAlign:'center'}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{margin:'0 auto 8px'}}>
                      <ellipse cx="12" cy="16" rx="6" ry="5" fill="#b45309"/>
                      <ellipse cx="12" cy="13" rx="5" ry="4" fill="#d97706"/>
                      <ellipse cx="12" cy="10" rx="4" ry="3" fill="#f59e0b"/>
                      <path d="M10 8c0-1 .5-2 2-2s2 1 2 2" stroke="#78350f" strokeWidth="1.5" fill="none"/>
                    </svg>
                    <div style={{fontSize:'1.8rem',fontWeight:800,color:'#ef4444',marginBottom:4}}>
                      {pooTotal}
                    </div>
                    <div style={{fontSize:'0.75rem',color:'#64748b',fontWeight:600}}>
                      อุจจาระ
                    </div>
                  </div>
                </div>

                {/* Action Statistics */}
                <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12}}>วิธีการขับถ่าย</div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12,background:'#f8fafc',borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M9 3v18"/>
                          <path d="M15 3v18"/>
                        </svg>
                        <span style={{fontSize:'0.85rem',fontWeight:600,color:'#475569'}}>ผ้าอ้อม</span>
                      </div>
                      <span style={{fontSize:'1.2rem',fontWeight:800,color:'#6366f1'}}>{diaperCount}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12,background:'#f8fafc',borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M8 15h8"/>
                          <path d="M9 9h.01"/>
                          <path d="M15 9h.01"/>
                        </svg>
                        <span style={{fontSize:'0.85rem',fontWeight:600,color:'#475569'}}>กระโถน</span>
                      </div>
                      <span style={{fontSize:'1.2rem',fontWeight:800,color:'#10b981'}}>{pottyCount}</span>
                    </div>
                  </div>
                </div>

                {/* Percentage Breakdown */}
                {totalCount > 0 && (
                  <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0f172a',marginBottom:12}}>สัดส่วน</div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                            <span style={{fontSize:'0.75rem',color:'#64748b'}}>ปัสสาวะ</span>
                          </div>
                          <span style={{fontSize:'0.75rem',fontWeight:700,color:'#f59e0b'}}>
                            {Math.round((peeTotal / totalCount) * 100)}%
                          </span>
                        </div>
                        <div style={{width:'100%',height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                          <div style={{
                            width:`${(peeTotal / totalCount) * 100}%`,
                            height:'100%',
                            background:'#f59e0b',
                            transition:'width 0.5s ease'
                          }}/>
                        </div>
                      </div>
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#b45309">
                              <ellipse cx="12" cy="14" rx="6" ry="6"/>
                            </svg>
                            <span style={{fontSize:'0.75rem',color:'#64748b'}}>อุจจาระ</span>
                          </div>
                          <span style={{fontSize:'0.75rem',fontWeight:700,color:'#ef4444'}}>
                            {Math.round((pooTotal / totalCount) * 100)}%
                          </span>
                        </div>
                        <div style={{width:'100%',height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                          <div style={{
                            width:`${(pooTotal / totalCount) * 100}%`,
                            height:'100%',
                            background:'#ef4444',
                            transition:'width 0.5s ease'
                          }}/>
                        </div>
                      </div>
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
              <path d="M7 11h10M7 15h6"/>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            <span style={{fontSize:'0.6rem',fontWeight:700}}>ขับถ่าย</span>
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
        </nav>
      </div>
    </div>
  );
}
