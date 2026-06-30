'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import NapSummarySkeleton from '@/components/loading/skeletons/NapSummarySkeleton';
import { usePageTracking } from '@/lib/useAnalytics';

export default function NapSummaryPage() {
  const { childId, enrollmentPeriod } = useUserApp();
  const router = useRouter();
  
  // Track page views
  usePageTracking();
  
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [showNoNapDates, setShowNoNapDates] = useState(false);
  const [noNapDates, setNoNapDates] = useState<string[]>([]);
  const [dayEntries, setDayEntries] = useState<{date: string}[]>([]);
  const [dayEntriesLoading, setDayEntriesLoading] = useState(false);
  const [napSummary, setNapSummary] = useState<{
    total_days: number;
    nap_days: number;
    avg_hours: number | null;
    max_hours: number | null;
    min_hours: number | null;
  }>({ total_days: 0, nap_days: 0, avg_hours: null, max_hours: null, min_hours: null });

  /* ── Load day entries ── */
  useEffect(() => {
    if (!childId) return;
    
    setDayEntriesLoading(true);
    fetch(`/api/report/dates?child_id=${childId}`)
      .then(r => r.json())
      .then(j => {
        const entries = j.data ?? [];
        console.log('Loaded dayEntries:', entries);
        setDayEntries(entries);
      })
      .catch(err => {
        console.error('Failed to load dayEntries:', err);
      })
      .finally(() => {
        setDayEntriesLoading(false);
      });
  }, [childId]);

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

  /* ── Load no-nap dates when requested ── */
  useEffect(() => {
    if (!showNoNapDates || !childId || !enrollmentPeriod) return;
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFrom = enrollmentPeriod.start;
    const dateTo = enrollmentPeriod.end || todayStr;
    
    fetch(`/api/report/nap-dates?child_id=${childId}&date_from=${dateFrom}&date_to=${dateTo}&has_nap=false`)
      .then(r=>r.json())
      .then(j=>{
        if (j.data) {
          setNoNapDates(j.data);
        }
      });
  }, [showNoNapDates, childId, enrollmentPeriod]);

  const napPercentage = napSummary.total_days > 0 
    ? Math.round((napSummary.nap_days / napSummary.total_days) * 100) 
    : 0;

  const handleDateClick = (date: string) => {
    if (dayEntries.length === 0) {
      alert('กำลังโหลดข้อมูล กรุณารอสักครู่...');
      return;
    }
    
    // Convert date to local YYYY-MM-DD format
    let dateToFind = date;
    if (date.includes('T') || date.includes('Z')) {
      // Parse as Date and get local date string
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateToFind = `${year}-${month}-${day}`;
    }
    
    const foundIdx = dayEntries.findIndex(entry => entry.date === dateToFind);
    
    if (foundIdx >= 0) {
      const targetUrl = `/?dayIdx=${foundIdx}`;
      router.push(targetUrl);
    }
  };

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
            <div style={{display:'flex',flexDirection:'column',gap:14,fontFamily:'Sarabun, sans-serif'}}>
              <>
                {/* Summary Card with Circular Progress */}
                <div style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:20}}>
                  {/* Circular Progress */}
                  <div style={{
                    position:'relative',
                    width:84,
                    height:84,
                    background:`conic-gradient(#818cf8 0% ${napPercentage}%, #f1f5f9 ${napPercentage}% 100%)`,
                    borderRadius:'50%',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    flexShrink:0
                  }}>
                    <div style={{width:70,height:70,background:'white',borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:2}}>
                        <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
                        <path d="M7 14c2 3 8 3 10 0"/>
                      </svg>
                      <span style={{fontSize:'0.9rem',fontWeight:800,color:'#6366f1',lineHeight:1}}>{napPercentage}%</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div style={{flex:1}}>
                    <div style={{fontSize:'1.35rem',fontWeight:800,color:'#0f172a',marginBottom:2}}>
                      {napSummary.nap_days} <span style={{fontSize:'0.85rem',color:'#64748b',fontWeight:500}}>/ {napSummary.total_days} วัน</span>
                    </div>
                    <div style={{fontSize:'0.8rem',color:'#475569',fontWeight:600,marginBottom:8}}>
                      {napSummary.nap_days === napSummary.total_days 
                        ? 'น้องนอนกลางวันครบทุกวัน' 
                        : `น้องนอนกลางวัน ${napSummary.nap_days} วัน`}
                    </div>
                    <div style={{display:'flex',gap:12,fontSize:'0.75rem',fontWeight:700,flexWrap:'wrap'}}>
                      <span style={{color:'#16a34a',background:'#dcfce7',padding:'2px 8px',borderRadius:6}}>
                        นอนแล้ว {napSummary.nap_days} วัน
                      </span>
                      {napSummary.total_days - napSummary.nap_days > 0 && (
                        <span 
                          onClick={() => setShowNoNapDates(!showNoNapDates)}
                          style={{
                            color:'#64748b',
                            background:'#f1f5f9',
                            padding:'2px 8px',
                            borderRadius:6,
                            cursor:'pointer',
                            display:'flex',
                            alignItems:'center',
                            gap:4,
                            transition:'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e2e8f0';
                            e.currentTarget.style.color = '#475569';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.color = '#64748b';
                          }}
                        >
                          ไม่นอน {napSummary.total_days - napSummary.nap_days} วัน
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{
                              transform: showNoNapDates ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          >
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* No-Nap Dates List */}
                {showNoNapDates && napSummary.total_days - napSummary.nap_days > 0 && (
                  <div style={{
                    background:'#fafafa',
                    padding:16,
                    borderRadius:12,
                    border:'1px solid #e2e8f0',
                    animation: 'slideDown 0.2s ease-out'
                  }}>
                    <div style={{fontSize:'0.85rem',fontWeight:700,color:'#334155',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      วันที่ไม่ได้นอนกลางวัน ({napSummary.total_days - napSummary.nap_days} วัน)
                    </div>
                    {noNapDates.length === 0 ? (
                      <div style={{fontSize:'0.8rem',color:'#94a3b8',textAlign:'center',padding:'12px 0'}}>
                        กำลังโหลด...
                      </div>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {noNapDates.map((date, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleDateClick(date)}
                            style={{
                              background:'white',
                              padding:'8px 12px',
                              borderRadius:8,
                              fontSize:'0.8rem',
                              color:'#475569',
                              fontWeight:600,
                              border:'1px solid #e2e8f0',
                              display:'flex',
                              alignItems:'center',
                              justifyContent:'space-between',
                              cursor:'pointer',
                              transition:'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                              {new Date(date).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Average Duration */}
                {napSummary.avg_hours !== null && (
                  <div style={{background:'white',padding:18,borderRadius:16,border:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,background:'#e0e7ff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#4338ca'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <span style={{fontSize:'0.85rem',fontWeight:700,color:'#334155'}}>ระยะเวลาเฉลี่ย</span>
                    </div>
                    {(() => {
                      const h = Math.floor(napSummary.avg_hours);
                      const m = Math.round((napSummary.avg_hours % 1) * 60);
                      
                      return (
                        <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                          {h > 0 && (
                            <>
                              <span style={{fontSize:'1.6rem',fontWeight:800,color:'#4338ca',lineHeight:1}}>{h}</span>
                              <span style={{fontSize:'0.75rem',color:'#64748b',fontWeight:700,marginRight:4}}>ชม.</span>
                            </>
                          )}
                          {m > 0 && (
                            <>
                              <span style={{fontSize:'1.6rem',fontWeight:800,color:'#4338ca',lineHeight:1}}>{m}</span>
                              <span style={{fontSize:'0.75rem',color:'#64748b',fontWeight:700}}>นาที</span>
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
                      <div style={{background:'#f0fdf4',padding:'14px 16px',borderRadius:14,border:'1px solid #bbf7d0',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:8}}>
                        <div style={{fontSize:'0.75rem',color:'#15803d',fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                          นอนมากสุด
                        </div>
                        {(() => {
                          const h = Math.floor(napSummary.max_hours);
                          const m = Math.round((napSummary.max_hours % 1) * 60);
                          
                          return (
                            <div style={{display:'flex',alignItems:'baseline',gap:2}}>
                              {h > 0 && (
                                <>
                                  <span style={{fontSize:'1.4rem',fontWeight:800,color:'#16a34a',lineHeight:1}}>{h}</span>
                                  <span style={{fontSize:'0.75rem',color:'#15803d',fontWeight:700}}>ชม.</span>
                                </>
                              )}
                              {m > 0 && h > 0 && <span style={{fontSize:'1.4rem',fontWeight:800,color:'#16a34a',lineHeight:1}}> </span>}
                              {m > 0 && (
                                <>
                                  <span style={{fontSize:'1.4rem',fontWeight:800,color:'#16a34a',lineHeight:1}}>{m}</span>
                                  <span style={{fontSize:'0.75rem',color:'#15803d',fontWeight:700}}>นาที</span>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Min Duration */}
                    {napSummary.min_hours !== null && (
                      <div style={{background:'#fffbeb',padding:'14px 16px',borderRadius:14,border:'1px solid #fef08a',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:8}}>
                        <div style={{fontSize:'0.75rem',color:'#a16207',fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                          นอนน้อยสุด
                        </div>
                        {(() => {
                          const h = Math.floor(napSummary.min_hours);
                          const m = Math.round((napSummary.min_hours % 1) * 60);
                          
                          return (
                            <div style={{display:'flex',alignItems:'baseline',gap:2}}>
                              {h > 0 && (
                                <>
                                  <span style={{fontSize:'1.4rem',fontWeight:800,color:'#b45309',lineHeight:1}}>{h}</span>
                                  <span style={{fontSize:'0.75rem',color:'#a16207',fontWeight:700,marginRight:h > 0 && m > 0 ? 2 : 0}}>ชม.</span>
                                </>
                              )}
                              {m > 0 && (
                                <>
                                  <span style={{fontSize:'1.4rem',fontWeight:800,color:'#b45309',lineHeight:1}}>{m}</span>
                                  <span style={{fontSize:'0.75rem',color:'#a16207',fontWeight:700}}>นาที</span>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </>
            </div>
          </LoadingWrapper>
      </div>
    </UserLayout>
  );
}
