'use client';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
import { ExcretionType, ExcretionAction } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import ExcretionSummarySkeleton from '@/components/loading/skeletons/ExcretionSummarySkeleton';

export default function ExcretionSummaryPage() {
  const { childId, enrollmentPeriod } = useUserApp();
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [excretionSummary, setExcretionSummary] = useState<{
    type: ExcretionType;
    action: ExcretionAction;
    count: number;
  }[]>([]);

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
    </UserLayout>
  );
}
