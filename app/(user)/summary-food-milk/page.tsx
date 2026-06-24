'use client';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
import { MilkStatus } from '@/types';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import FoodSummarySkeleton from '@/components/loading/skeletons/FoodSummarySkeleton';
import { usePageTracking } from '@/lib/useAnalytics';

const amtL: Record<MilkStatus,string> = { all:'ทานหมด', some:'บางส่วน', not_must:'นิดหน่อย', skip:'ข้าม' };

export default function FoodMilkSummaryPage() {
  const { childId, enrollmentPeriod } = useUserApp();
  
  // Track page views
  usePageTracking();
  
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [foodSummary, setFoodSummary] = useState<{
    food: { food_amount: MilkStatus; count: number }[];
    fruit: { fruit_amount: MilkStatus; count: number }[];
    milk1: { milk_amount: MilkStatus; count: number }[];
    milk2: { milk_amount: MilkStatus; count: number }[];
  }>({ food: [], fruit: [], milk1: [], milk2: [] });
  const [foodNotes, setFoodNotes] = useState<Array<{name: string, notes: string[]}>>([]);
  const [fruitNotes, setFruitNotes] = useState<Array<{name: string, notes: string[]}>>([]);
  const [notEatenFood, setNotEatenFood] = useState<Array<{name: string, notes: string[]}>>([]);
  const [notEatenFruit, setNotEatenFruit] = useState<Array<{name: string, notes: string[]}>>([]);
  
  // Toggle states
  const [showAddedFood, setShowAddedFood] = useState(false);
  const [showAddedFruit, setShowAddedFruit] = useState(false);
  const [showNotEatenFood, setShowNotEatenFood] = useState(false);
  const [showNotEatenFruit, setShowNotEatenFruit] = useState(false);

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
          setFoodNotes(j.data?.food_items || []);
          setFruitNotes(j.data?.fruit_items || []);
          setNotEatenFood(j.data?.not_eaten_food || []);
          setNotEatenFruit(j.data?.not_eaten_fruit || []);
          
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

  return (
    <UserLayout>
      {/* Content */}
      <div style={{padding:'16px'}}>
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

            {/* Food Notes */}
            {foodNotes.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div 
                  onClick={() => setShowAddedFood(!showAddedFood)}
                  style={{
                    fontSize:'0.9rem',
                    fontWeight:700,
                    color:'#0f172a',
                    marginBottom: showAddedFood ? 12 : 0,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    cursor:'pointer',
                    userSelect:'none'
                  }}
                >
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                      <path d="M7 2v20"/>
                      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                    </svg>
                    อาหารที่เพิ่ม ({foodNotes.length})
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transform: showAddedFood ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showAddedFood && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {foodNotes.map((item, idx) => (
                      <div key={idx} style={{
                        padding:'12px',
                        background:'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderRadius:12,
                        border:'1px solid #93c5fd'
                      }}>
                        <div style={{fontSize:'0.9rem',fontWeight:700,color:'#1e3a8a',marginBottom:6}}>
                          {item.name}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.notes.map((note, noteIdx) => (
                            <div key={noteIdx} style={{
                              fontSize:'0.8rem',
                              color:'#1e40af',
                              paddingLeft:8,
                              borderLeft:'2px solid #3b82f6'
                            }}>
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fruit Notes */}
            {fruitNotes.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div 
                  onClick={() => setShowAddedFruit(!showAddedFruit)}
                  style={{
                    fontSize:'0.9rem',
                    fontWeight:700,
                    color:'#0f172a',
                    marginBottom: showAddedFruit ? 12 : 0,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    cursor:'pointer',
                    userSelect:'none'
                  }}
                >
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <svg width="20" height="20" viewBox="0 0 512 512" fill="none" stroke="#ef4444" strokeWidth="20">
                      <path d="M445.618,228.059h-42.029l27.986-43.14c1.954-3.012,1.096-7.037-1.916-8.991c-3.011-1.953-7.036-1.097-8.99,1.916l-32.576,50.215h-70.124c-2.758-63.71-45.818-114.503-98.357-114.503c-46.697,0-86.652,40.321-96.29,95.396C95.139,188.996,75.1,164.417,70.731,143.56c-1.033-4.947-4.933-8.683-9.936-9.518c-4.923-0.823-9.735,1.366-12.333,5.579c-0.116,0.18-0.21,0.344-0.287,0.487c-8.978,15.282-11.588,33.751-7.811,52.788c-4.686-4.875-8.418-9.9-10.996-14.962c-2.297-4.498-7.044-7.077-12.088-6.572c-5.022,0.502-9.144,3.953-10.5,8.801l-0.047,0.17c-7.67,27.815,2.96,57.899,27.076,81.47c-5.247-2.475-9.847-5.33-13.638-8.552c-3.893-3.31-9.313-3.891-13.809-1.481c-4.399,2.358-6.863,7.083-6.276,12.036l0.034,0.276c2.977,23.833,18.146,44.562,42.713,58.368c18.833,10.583,41.506,16.112,65.323,16.111c6.442,0,12.972-0.405,19.526-1.223c15.844-1.979,30.252-5.563,42.955-10.496c14.35,7.672,31.206,11.714,48.975,11.714c26.114,0,49.632-8.628,66.982-24.424c16.946,15.588,39.94,24.427,67.025,24.427c58.916,0,98.5-41.794,98.5-104C452.118,230.969,449.208,228.059,445.618,228.059z M201.131,133.386c0,0.477-2,2.5-6,2.5c-3.508,0-5.476-1.555-5.908-2.259c2.088-1.007,4.215-1.91,6.375-2.711C199.273,131.07,201.131,132.928,201.131,133.386z" fill="#ef4444" opacity="0.3"/>
                      <path d="M234.036,135.066c-10.654,0-19,6.808-19,15.5s8.346,15.5,19,15.5s19-6.808,19-15.5S244.69,135.066,234.036,135.066z M234.036,153.066c-4,0-6-2.023-6-2.5s2-2.5,6-2.5s6,2.023,6,2.5S238.036,153.066,234.036,153.066z" fill="#ef4444" opacity="0.3"/>
                    </svg>
                    ผลไม้ที่เพิ่ม ({fruitNotes.length})
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transform: showAddedFruit ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showAddedFruit && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {fruitNotes.map((item, idx) => (
                      <div key={idx} style={{
                        padding:'12px',
                        background:'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                        borderRadius:12,
                        border:'1px solid #7dd3fc'
                      }}>
                        <div style={{fontSize:'0.9rem',fontWeight:700,color:'#0c4a6e',marginBottom:6}}>
                          {item.name}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.notes.map((note, noteIdx) => (
                            <div key={noteIdx} style={{
                              fontSize:'0.8rem',
                              color:'#075985',
                              paddingLeft:8,
                              borderLeft:'2px solid #0ea5e9'
                            }}>
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Not Eaten Food */}
            {notEatenFood.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div 
                  onClick={() => setShowNotEatenFood(!showNotEatenFood)}
                  style={{
                    fontSize:'0.9rem',
                    fontWeight:700,
                    color:'#0f172a',
                    marginBottom: showNotEatenFood ? 12 : 0,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    cursor:'pointer',
                    userSelect:'none'
                  }}
                >
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                      <path d="M7 2v20"/>
                      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    อาหารที่ไม่ทาน ({notEatenFood.length})
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transform: showNotEatenFood ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showNotEatenFood && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {notEatenFood.map((item, idx) => (
                      <div key={idx} style={{
                        padding:'12px',
                        background:'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        borderRadius:12,
                        border:'1px solid #cbd5e1'
                      }}>
                        <div style={{fontSize:'0.9rem',fontWeight:700,color:'#475569',marginBottom:6}}>
                          {item.name}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.notes.map((note, noteIdx) => (
                            <div key={noteIdx} style={{
                              fontSize:'0.8rem',
                              color:'#64748b',
                              paddingLeft:8,
                              borderLeft:'2px solid #94a3b8'
                            }}>
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Not Eaten Fruit */}
            {notEatenFruit.length > 0 && (
              <div style={{background:'white',padding:16,borderRadius:16,border:'1px solid #e2e8f0'}}>
                <div 
                  onClick={() => setShowNotEatenFruit(!showNotEatenFruit)}
                  style={{
                    fontSize:'0.9rem',
                    fontWeight:700,
                    color:'#0f172a',
                    marginBottom: showNotEatenFruit ? 12 : 0,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    cursor:'pointer',
                    userSelect:'none'
                  }}
                >
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <svg width="20" height="20" viewBox="0 0 512 512" fill="none" stroke="#94a3b8" strokeWidth="20">
                      <path d="M445.618,228.059h-42.029l27.986-43.14c1.954-3.012,1.096-7.037-1.916-8.991c-3.011-1.953-7.036-1.097-8.99,1.916l-32.576,50.215h-70.124c-2.758-63.71-45.818-114.503-98.357-114.503c-46.697,0-86.652,40.321-96.29,95.396C95.139,188.996,75.1,164.417,70.731,143.56c-1.033-4.947-4.933-8.683-9.936-9.518c-4.923-0.823-9.735,1.366-12.333,5.579c-0.116,0.18-0.21,0.344-0.287,0.487c-8.978,15.282-11.588,33.751-7.811,52.788c-4.686-4.875-8.418-9.9-10.996-14.962c-2.297-4.498-7.044-7.077-12.088-6.572c-5.022,0.502-9.144,3.953-10.5,8.801l-0.047,0.17c-7.67,27.815,2.96,57.899,27.076,81.47c-5.247-2.475-9.847-5.33-13.638-8.552c-3.893-3.31-9.313-3.891-13.809-1.481c-4.399,2.358-6.863,7.083-6.276,12.036l0.034,0.276c2.977,23.833,18.146,44.562,42.713,58.368c18.833,10.583,41.506,16.112,65.323,16.111c6.442,0,12.972-0.405,19.526-1.223c15.844-1.979,30.252-5.563,42.955-10.496c14.35,7.672,31.206,11.714,48.975,11.714c26.114,0,49.632-8.628,66.982-24.424c16.946,15.588,39.94,24.427,67.025,24.427c58.916,0,98.5-41.794,98.5-104C452.118,230.969,449.208,228.059,445.618,228.059z M201.131,133.386c0,0.477-2,2.5-6,2.5c-3.508,0-5.476-1.555-5.908-2.259c2.088-1.007,4.215-1.91,6.375-2.711C199.273,131.07,201.131,132.928,201.131,133.386z" fill="#94a3b8" opacity="0.3"/>
                      <path d="M234.036,135.066c-10.654,0-19,6.808-19,15.5s8.346,15.5,19,15.5s19-6.808,19-15.5S244.69,135.066,234.036,135.066z M234.036,153.066c-4,0-6-2.023-6-2.5s2-2.5,6-2.5s6,2.023,6,2.5S238.036,153.066,234.036,153.066z" fill="#94a3b8" opacity="0.3"/>
                      <line x1="400" y1="150" x2="100" y2="350" stroke="#94a3b8" strokeWidth="30"/>
                      <line x1="100" y1="150" x2="400" y2="350" stroke="#94a3b8" strokeWidth="30"/>
                    </svg>
                    ผลไม้ที่ไม่ทาน ({notEatenFruit.length})
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transform: showNotEatenFruit ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showNotEatenFruit && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {notEatenFruit.map((item, idx) => (
                      <div key={idx} style={{
                        padding:'12px',
                        background:'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        borderRadius:12,
                        border:'1px solid #cbd5e1'
                      }}>
                        <div style={{fontSize:'0.9rem',fontWeight:700,color:'#475569',marginBottom:6}}>
                          {item.name}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.notes.map((note, noteIdx) => (
                            <div key={noteIdx} style={{
                              fontSize:'0.8rem',
                              color:'#64748b',
                              paddingLeft:8,
                              borderLeft:'2px solid #94a3b8'
                            }}>
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      </UserLayout>
  );
}
