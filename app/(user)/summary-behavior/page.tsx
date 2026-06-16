'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import BehaviorCardSkeleton from '@/components/loading/skeletons/BehaviorCardSkeleton';
import { FaceHappy, FaceSmile, FaceNeutral, Calendar, Book } from '@/components/icons';
import { usePageTracking, trackClick } from '@/lib/useAnalytics';

interface BehaviorSummaryItem {
  item_id:string;
  name_th:string;
  category_name_th:string;
  avg_score:number;
  max_score:number;
  daily_scores:{date:string;score:number}[];
  days_recorded:number;
}

interface DayEntry { date:string; daily_id:string; report_id:string|null; activity?:string }

export default function SummaryPage() {
  const router = useRouter();
  const { childId, enrollmentPeriod } = useUserApp();
  
  // Track page views
  usePageTracking();
  
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorSummaryItem[]>([]);
  const [dayEntries,  setDayEntries]  = useState<DayEntry[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set()); // Track expanded items
  const [faceFilters, setFaceFilters] = useState<Record<string, 'all' | 'happy' | 'smile' | 'neutral'>>({}); // Track face filter per item

  /* ── child → days with activities ── */
  useEffect(()=>{
    if (!childId || !enrollmentPeriod) return;
    let cancelled = false;
    
    // Load days
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(datesJson=>{
        if (cancelled) return;
        const dates = datesJson.data ?? [];
        
        // Load activities
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const endDateStr = enrollmentPeriod.end || todayStr;
        
        fetch(`/api/report/activities?child_id=${childId}&start_date=${enrollmentPeriod.start}&end_date=${endDateStr}`)
          .then(r=>r.json())
          .then(actJson=>{
            if (cancelled) return;
            const activities = actJson.data ?? [];
            
            // Merge activities into dates
            const datesWithActivity = dates.map((entry: DayEntry) => {
              const activity = activities.find((a: any) => a.date === entry.date);
              return {
                ...entry,
                activity: activity?.activity || null
              };
            });
            
            setDayEntries(datesWithActivity);
          });
      });
    
    return () => { cancelled = true; };
  },[childId, enrollmentPeriod]);

  /* ── Load behavior summary ── */
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
    
    return () => { cancelled = true; };
  }, [childId, enrollmentPeriod]);

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const setFaceFilter = (itemId: string, filter: 'all' | 'happy' | 'smile' | 'neutral') => {
    setFaceFilters(prev => ({
      ...prev,
      [itemId]: filter
    }));
  };

  return (
    <UserLayout>
      {/* ─── BEHAVIOR SUMMARY ─────────────────────────────── */}
      {childId && (
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
                      const isExpanded = expandedItems.has(item.item_id);
                      
                      // นับจำนวนแต่ละ Face
                      const faceCount = {
                        happy: 0,
                        smile: 0,
                        neutral: 0
                      };
                      
                      item.daily_scores.forEach(day => {
                        const percent = (day.score / item.max_score) * 100;
                        if (percent >= 80) faceCount.happy++;
                        else if (percent >= 60) faceCount.smile++;
                        else faceCount.neutral++;
                      });
                      
                      return (
                        <div key={item.item_id} style={{display:'flex',flexDirection:'column',gap:0,background:'white',borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                          {/* Header - คลิกเพื่อขยาย/ยุบ */}
                          <div 
                            onClick={() => toggleItem(item.item_id)}
                            style={{
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              padding:'14px 16px',
                              cursor:'pointer',
                              transition:'all 0.15s',
                              background: isExpanded ? '#f8fafc' : 'white'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = isExpanded ? '#f8fafc' : 'white'}
                          >
                            <div style={{display:'flex',alignItems:'center',gap:12,flex:1}}>
                              <svg 
                                width="12" 
                                height="12" 
                                viewBox="0 0 12 12" 
                                fill="none"
                                style={{
                                  transition:'transform 0.2s',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  flexShrink: 0
                                }}
                              >
                                <path 
                                  d="M3 2L8 6L3 10V2Z" 
                                  fill="#94a3b8"
                                />
                              </svg>
                              <span style={{fontSize:'0.9rem',fontWeight:600,color:'#1e293b',flex:1}}>{item.name_th}</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              {/* สรุปจำนวนแต่ละ Face - คลิกเพื่อกรอง */}
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                {faceCount.happy > 0 && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const currentFilter = faceFilters[item.item_id] || 'all';
                                      setFaceFilter(item.item_id, currentFilter === 'happy' ? 'all' : 'happy');
                                      if (!isExpanded) toggleItem(item.item_id);
                                    }}
                                    style={{
                                      display:'flex',
                                      alignItems:'center',
                                      gap:3,
                                      background: (faceFilters[item.item_id] === 'happy') ? '#10b981' : '#d1fae5',
                                      padding:'4px 8px',
                                      borderRadius:6,
                                      cursor:'pointer',
                                      transition:'all 0.15s',
                                      border: (faceFilters[item.item_id] === 'happy') ? '2px solid #10b981' : '2px solid transparent'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                    <FaceHappy size={16} color={(faceFilters[item.item_id] === 'happy') ? 'white' : '#10b981'} />
                                    <span style={{fontSize:'0.7rem',fontWeight:700,color:(faceFilters[item.item_id] === 'happy') ? 'white' : '#10b981'}}>{faceCount.happy}</span>
                                  </div>
                                )}
                                {faceCount.smile > 0 && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const currentFilter = faceFilters[item.item_id] || 'all';
                                      setFaceFilter(item.item_id, currentFilter === 'smile' ? 'all' : 'smile');
                                      if (!isExpanded) toggleItem(item.item_id);
                                    }}
                                    style={{
                                      display:'flex',
                                      alignItems:'center',
                                      gap:3,
                                      background: (faceFilters[item.item_id] === 'smile') ? '#facc15' : '#fef3c7',
                                      padding:'4px 8px',
                                      borderRadius:6,
                                      cursor:'pointer',
                                      transition:'all 0.15s',
                                      border: (faceFilters[item.item_id] === 'smile') ? '2px solid #facc15' : '2px solid transparent'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                    <FaceSmile size={16} color={(faceFilters[item.item_id] === 'smile') ? 'white' : '#facc15'} />
                                    <span style={{fontSize:'0.7rem',fontWeight:700,color:(faceFilters[item.item_id] === 'smile') ? 'white' : '#ca8a04'}}>{faceCount.smile}</span>
                                  </div>
                                )}
                                {faceCount.neutral > 0 && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const currentFilter = faceFilters[item.item_id] || 'all';
                                      setFaceFilter(item.item_id, currentFilter === 'neutral' ? 'all' : 'neutral');
                                      if (!isExpanded) toggleItem(item.item_id);
                                    }}
                                    style={{
                                      display:'flex',
                                      alignItems:'center',
                                      gap:3,
                                      background: (faceFilters[item.item_id] === 'neutral') ? '#f97316' : '#fed7aa',
                                      padding:'4px 8px',
                                      borderRadius:6,
                                      cursor:'pointer',
                                      transition:'all 0.15s',
                                      border: (faceFilters[item.item_id] === 'neutral') ? '2px solid #f97316' : '2px solid transparent'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                    <FaceNeutral size={16} color={(faceFilters[item.item_id] === 'neutral') ? 'white' : '#f97316'} />
                                    <span style={{fontSize:'0.7rem',fontWeight:700,color:(faceFilters[item.item_id] === 'neutral') ? 'white' : '#c2410c'}}>{faceCount.neutral}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* รายละเอียด - แสดงเมื่อขยาย */}
                          {isExpanded && (
                            <div style={{display:'flex',flexDirection:'column',gap:4,padding:'0 16px 14px',background:'#f8fafc'}}>
                              <div style={{height:1,background:'#e2e8f0',margin:'0 0 8px'}} />
                              {(() => {
                                // Apply filter
                                const currentFilter = faceFilters[item.item_id] || 'all';
                                const filteredDays = item.daily_scores.filter(day => {
                                  if (currentFilter === 'all') return true;
                                  const percent = (day.score / item.max_score) * 100;
                                  if (currentFilter === 'happy') return percent >= 80;
                                  if (currentFilter === 'smile') return percent >= 60 && percent < 80;
                                  if (currentFilter === 'neutral') return percent < 60;
                                  return true;
                                });
                                
                                return filteredDays.length > 0 ? (
                                  filteredDays.map((day, idx) => {
                                  const dayScorePercent = (day.score / item.max_score) * 100;
                                  
                                  // Face icon สำหรับแต่ละวัน
                                  let dayFaceIcon;
                                  if (dayScorePercent >= 80) {
                                    dayFaceIcon = <FaceHappy size={20} color="#10b981" />;
                                  } else if (dayScorePercent >= 60) {
                                    dayFaceIcon = <FaceSmile size={20} color="#facc15" />;
                                  } else {
                                    dayFaceIcon = <FaceNeutral size={20} color="#f97316" />;
                                  }
                                  
                                  // Format date
                                  const dateObj = new Date(day.date + 'T00:00:00');
                                  const thaiDate = dateObj.toLocaleDateString('th-TH', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  });
                                  
                                  // หา activity ของวันนั้น
                                  const dayEntry = dayEntries.find(e => e.date === day.date);
                                  const activity = dayEntry?.activity;
                                  
                                  return (
                                    <div
                                      key={idx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const foundIdx = dayEntries.findIndex(entry => entry.date === day.date);
                                        if (foundIdx >= 0) {
                                          // ส่ง dayIdx ผ่าน query parameter
                                          router.push(`/?dayIdx=${foundIdx}`);
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        padding: '10px 14px',
                                        background: 'white',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        border: '1px solid #e2e8f0'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateX(3px)';
                                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateX(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                      }}
                                    >
                                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                                          <Calendar size={14} color="#94a3b8" />
                                          <span style={{fontSize:'0.8rem',color:'#64748b',fontWeight:500}}>
                                            {thaiDate}
                                          </span>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                                          {dayFaceIcon}
                                        </div>
                                      </div>
                                      {/* แสดงกิจกรรม */}
                                      {activity && (
                                        <div style={{
                                          fontSize:'0.75rem',
                                          color:'#6366f1',
                                          background:'#f0f9ff',
                                          padding:'6px 10px',
                                          borderRadius:6,
                                          display:'flex',
                                          alignItems:'center',
                                          gap:6
                                        }}>
                                          <Book size={14} color="#6366f1" />
                                          <span>{activity}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                                ) : (
                                  <div style={{padding:'12px',textAlign:'center',color:'#94a3b8',fontSize:'0.75rem',background:'white',borderRadius:8}}>
                                    {currentFilter === 'all' ? 'ยังไม่มีคะแนน' : `ไม่มีวันที่ตรงกับเงื่อนไข`}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
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
      </UserLayout>
    );
}
