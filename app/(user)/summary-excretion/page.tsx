'use client';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
import { ExcretionType, ExcretionAction } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import ExcretionSummarySkeleton from '@/components/loading/skeletons/ExcretionSummarySkeleton';
import { usePageTracking } from '@/lib/useAnalytics';

export default function ExcretionSummaryPage() {
  const { childId, enrollmentPeriod } = useUserApp();
  
  // Track page views
  usePageTracking();
  
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [excretionSummary, setExcretionSummary] = useState<{
    type: ExcretionType;
    action: ExcretionAction;
    count: number;
  }[]>([]);
  const [firstPottyDate, setFirstPottyDate] = useState<string | null>(null);

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
          setFirstPottyDate(j.data?.first_potty_date || null);
          
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

  return (
    <UserLayout>
      {/* Content */}
      <div style={{padding:'16px'}}>
        <LoadingWrapper
            isLoading={dataLoading}
            hasData={excretionSummary.length > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod}
            shimmerComponent={<ExcretionSummarySkeleton />}
          >
            <div style={{display:'flex',flexDirection:'column',gap:14,fontFamily:'Sarabun, sans-serif'}}>
              <>
                {/* First Potty Date */}
                {firstPottyDate && (
                  <div style={{background:'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',padding:20,borderRadius:16,border:'1px solid #10b98133'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:12}}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        <circle cx="12" cy="12" r="3" fill="#10b981"/>
                      </svg>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'0.75rem',color:'#059669',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4,display:'flex',alignItems:'center',flexDirection:'column',gap:6}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5.5 2L3 7.5L7 8L3 14" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2L21 7.5L17 8L21 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="4" r="1.5" fill="#ef4444"/>
                            <circle cx="8" cy="6" r="1" fill="#3b82f6"/>
                            <circle cx="16" cy="6" r="1" fill="#ec4899"/>
                            <path d="M10 18L9 22" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M14 18L15 22" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M12 19L12 23" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          เริ่มใช้กระโถน
                        </div>
                        <div style={{fontSize:'1.4rem',fontWeight:800,color:'#10b981'}}>
                          {new Date(firstPottyDate).toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div style={{fontSize:'0.7rem',color:'#059669',marginTop:4}}>
                          วันแรกที่เลิกใช้ผ้าอ้อม
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e2e8f0',textAlign:'center'}}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 12px'}}>
                    <path d="M7 11h10M7 15h6"/>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  <div style={{fontSize:'1.1rem',fontWeight:600,color:'#64748b',marginBottom:4}}>
                    ทั้งหมด
                  </div>
                  <div style={{fontSize:'2rem',fontWeight:800,color:'#0f172a',marginBottom:4}}>
                    {totalCount}
                  </div>
                  <div style={{fontSize:'1rem',fontWeight:600,color:'#64748b'}}>
                    ครั้ง
                  </div>
                </div>

                {/* 1. SUMMARY STATS (GRID) */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {/* Card: ฉี่ */}
                  <div style={{background:'#f0f9ff',padding:16,borderRadius:14,border:'1px solid #bae6fd',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,background:'#e0f2fe',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#38bdf8">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                      </svg>
                    </div>
                    <div>
                      <span style={{fontSize:'0.75rem',color:'#0369a1',fontWeight:500,display:'block',marginBottom:2}}>ฉี่ (ปัสสาวะ)</span>
                      <span style={{fontSize:'1.4rem',fontWeight:800,color:'#0369a1',lineHeight:1}}>
                        {peeTotal} <span style={{fontSize:'0.8rem',fontWeight:500,color:'#6b7280'}}>ครั้ง</span>
                      </span>
                    </div>
                  </div>

                  {/* Card: อึ */}
                  <div style={{background:'#fffbeb',padding:16,borderRadius:14,border:'1px solid #fef08a',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,background:'#fef9c3',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#a16207">
                        <path d="M12 2C9 2 7 4 7 6.5c0 1.7.7 3 1.5 4.5C9.3 12.5 10 14 10 16c0 2.2 1.8 4 4 4s4-1.8 4-4c0-2-.7-3.5-1.5-5-.8-1.5-1.5-2.8-1.5-4.5C15 4 13 2 12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <span style={{fontSize:'0.75rem',color:'#a16207',fontWeight:500,display:'block',marginBottom:2}}>อึ (อุจจาระ)</span>
                      <span style={{fontSize:'1.4rem',fontWeight:800,color:'#a16207',lineHeight:1}}>
                        {pooTotal} <span style={{fontSize:'0.8rem',fontWeight:500,color:'#6b7280'}}>ครั้ง</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. DETAILS CARD (METHODS & RATIO) */}
                <div style={{background:'#ffffff',padding:18,borderRadius:16,border:'1px solid #e2e8f0'}}>
                  {/* 2.1: สัดส่วนการขับถ่ายแบบ Segmented Bar */}
                  {totalCount > 0 && (
                    <div style={{marginBottom:20,borderBottom:'1px dashed #e2e8f0',paddingBottom:18}}>
                      <span style={{fontSize:'0.8rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:12}}>
                        สัดส่วนการขับถ่าย
                      </span>
                      
                      {/* Segmented Progress Bar */}
                      <div style={{width:'100%',height:12,background:'#f1f5f9',borderRadius:6,overflow:'hidden',display:'flex',marginBottom:12}}>
                        <div 
                          style={{
                            width:`${(peeTotal / totalCount) * 100}%`,
                            height:'100%',
                            background:'#38bdf8',
                            transition:'width 0.5s'
                          }} 
                          title={`ฉี่ ${Math.round((peeTotal / totalCount) * 100)}%`}
                        />
                        <div 
                          style={{
                            width:`${(pooTotal / totalCount) * 100}%`,
                            height:'100%',
                            background:'#a16207',
                            transition:'width 0.5s'
                          }} 
                          title={`อึ ${Math.round((pooTotal / totalCount) * 100)}%`}
                        />
                      </div>

                      {/* Legend Labels */}
                      <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
                        {/* ฉี่ */}
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{width:8,height:8,background:'#38bdf8',borderRadius:'50%'}}/>
                          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#334155'}}>ฉี่ (ปัสสาวะ)</span>
                          <span style={{fontSize:'0.75rem',fontWeight:700,color:'#0369a1',background:'#e0f2fe',padding:'1px 6px',borderRadius:4}}>
                            {Math.round((peeTotal / totalCount) * 100)}%
                          </span>
                        </div>
                        
                        {/* อึ */}
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{width:8,height:8,background:'#a16207',borderRadius:'50%'}}/>
                          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#334155'}}>อึ (อุจจาระ)</span>
                          <span style={{fontSize:'0.75rem',fontWeight:700,color:'#a16207',background:'#fef9c3',padding:'1px 6px',borderRadius:4}}>
                            {Math.round((pooTotal / totalCount) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2.2: วิธีการขับถ่าย (Minimal List) */}
                  <div>
                    <span style={{fontSize:'0.8rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:10}}>
                      วิธีการขับถ่าย (รวม {totalCount} ครั้ง)
                    </span>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {/* แถวผ้าอ้อม */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',opacity:diaperCount > 0 ? 1 : 0.4}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <i className="bi bi-grid-3x3-gap" style={{color:'#6366f1',fontSize:'1rem'}}/>
                          <span style={{fontSize:'0.85rem',color:'#475569',fontWeight:500}}>ใส่ผ้าอ้อม</span>
                        </div>
                        <span style={{fontSize:'0.95rem',fontWeight:diaperCount > 0 ? 700 : 600,color:diaperCount > 0 ? '#1e293b' : '#64748b'}}>
                          {diaperCount} ครั้ง
                        </span>
                      </div>

                      {/* แถวกระโถน */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',opacity:pottyCount > 0 ? 1 : 0.4}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <i className="bi bi-emoji-smile" style={{color:'#10b981',fontSize:'1rem'}}/>
                          <span style={{fontSize:'0.85rem',color:'#475569',fontWeight:500}}>นั่งกระโถน</span>
                        </div>
                        <span style={{fontSize:'0.95rem',fontWeight:pottyCount > 0 ? 700 : 600,color:pottyCount > 0 ? '#1e293b' : '#64748b'}}>
                          {pottyCount} ครั้ง
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            </div>
          </LoadingWrapper>
      </div>
    </UserLayout>
  );
}
