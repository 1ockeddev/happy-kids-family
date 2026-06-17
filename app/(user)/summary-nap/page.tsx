'use client';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import NapSummarySkeleton from '@/components/loading/skeletons/NapSummarySkeleton';
import { usePageTracking } from '@/lib/useAnalytics';

export default function NapSummaryPage() {
  const { childId, enrollmentPeriod } = useUserApp();
  
  // Track page views
  usePageTracking();
  
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [napSummary, setNapSummary] = useState<{
    total_days: number;
    nap_days: number;
    avg_hours: number | null;
    max_hours: number | null;
    min_hours: number | null;
  }>({ total_days: 0, nap_days: 0, avg_hours: null, max_hours: null, min_hours: null });

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
          const napData = j.data?.nap || { 
            total_days: 0, 
            nap_days: 0, 
            avg_hours: null, 
            max_hours: null, 
            min_hours: null 
          };
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

  const napPercentage = napSummary.total_days > 0 
    ? Math.round((napSummary.nap_days / napSummary.total_days) * 100) 
    : 0;

  return (
    <UserLayout>
      {/* Content */}
      <div style={{padding:'16px'}}>
        <LoadingWrapper
            isLoading={dataLoading}
            hasData={napSummary.total_days > 0}
            showShimmer={showShimmer}
            showEmptyState={!!childId && !!enrollmentPeriod}
            shimmerComponent={<NapSummarySkeleton />}
          >
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <>
                {/* Summary Card */}
                <div style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e2e8f0',textAlign:'center'}}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 12px'}}>
                    <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
                    <path d="M7 14c2 3 8 3 10 0"/>
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
                    {(() => {
                      const h = Math.floor(napSummary.avg_hours);
                      const m = Math.round((napSummary.avg_hours % 1) * 60);
                      
                      if (h === 0) {
                        return (
                          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                            <span style={{fontSize:'2.5rem',fontWeight:800,color:'#6366f1'}}>{m}</span>
                            <span style={{fontSize:'1rem',color:'#64748b',fontWeight:600}}>นาที</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                          <span style={{fontSize:'2.5rem',fontWeight:800,color:'#6366f1'}}>{h}</span>
                          <span style={{fontSize:'1rem',color:'#64748b',fontWeight:600}}>ชั่วโมง</span>
                          {m > 0 && (
                            <>
                              <span style={{fontSize:'2.5rem',fontWeight:800,color:'#6366f1'}}>{m}</span>
                              <span style={{fontSize:'1rem',color:'#64748b',fontWeight:600}}>นาที</span>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Max & Min Duration */}
                {(napSummary.max_hours !== null || napSummary.min_hours !== null) && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {/* Max Duration */}
                    {napSummary.max_hours !== null && (
                      <div style={{background:'#f0fdf4',padding:16,borderRadius:12,border:'1px solid #10b98122'}}>
                        <div style={{fontSize:'0.7rem',color:'#059669',fontWeight:600,marginBottom:8,textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                          นานสุด
                        </div>
                        {(() => {
                          const h = Math.floor(napSummary.max_hours);
                          const m = Math.round((napSummary.max_hours % 1) * 60);
                          
                          if (h === 0) {
                            return (
                              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                                <span style={{fontSize:'1.6rem',fontWeight:800,color:'#10b981'}}>{m}</span>
                                <span style={{fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>นาที</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                              <span style={{fontSize:'1.6rem',fontWeight:800,color:'#10b981'}}>{h}</span>
                              <span style={{fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>ชม.</span>
                              {m > 0 && (
                                <>
                                  <span style={{fontSize:'1.6rem',fontWeight:800,color:'#10b981'}}>{m}</span>
                                  <span style={{fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>นาที</span>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Min Duration */}
                    {napSummary.min_hours !== null && (
                      <div style={{background:'#fef3c7',padding:16,borderRadius:12,border:'1px solid #f59e0b22'}}>
                        <div style={{fontSize:'0.7rem',color:'#d97706',fontWeight:600,marginBottom:8,textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                          สั้นสุด
                        </div>
                        {(() => {
                          const h = Math.floor(napSummary.min_hours);
                          const m = Math.round((napSummary.min_hours % 1) * 60);
                          
                          if (h === 0) {
                            return (
                              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                                <span style={{fontSize:'1.6rem',fontWeight:800,color:'#f59e0b'}}>{m}</span>
                                <span style={{fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>นาที</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                              <span style={{fontSize:'1.6rem',fontWeight:800,color:'#f59e0b'}}>{h}</span>
                              <span style={{fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>ชม.</span>
                              {m > 0 && (
                                <>
                                  <span style={{fontSize:'1.6rem',fontWeight:800,color:'#f59e0b'}}>{m}</span>
                                  <span style={{fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>นาที</span>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
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
    </UserLayout>
  );
}
