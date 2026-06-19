import { Diaper, Toilet } from '@/components/icons';
import { FoodSummary } from './types';
import { amountLabels } from './constants';

interface FoodStatsSummaryProps {
  foodSummary: FoodSummary;
}

export default function FoodStatsSummary({ foodSummary }: FoodStatsSummaryProps) {
  return (
    <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📊 สรุปสถิติ
          </span>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>ตลอดช่วงเรียน</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Food Statistics */}
        {foodSummary.food?.length > 0 && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
              อาหารกลางวัน
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {foodSummary.food.map((item) => (
                <div key={item.food_amount} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{amountLabels[item.food_amount]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        height: 6,
                        width: Math.max(20, (item.count / Math.max(...foodSummary.food.map((f) => f.count))) * 100),
                        background: item.food_amount === 'all' ? '#10b981' : item.food_amount === 'some' ? '#f59e0b' : '#94a3b8',
                        borderRadius: 3
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', minWidth: 30, textAlign: 'right' }}>{item.count} ครั้ง</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fruit Statistics */}
        {foodSummary.fruit?.length > 0 && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 512 512" fill="#ef4444" opacity="0.8">
                <path d="M445.618,228.059h-42.029l27.986-43.14c1.954-3.012,1.096-7.037-1.916-8.991c-3.011-1.953-7.036-1.097-8.99,1.916l-32.576,50.215h-70.124c-2.758-63.71-45.818-114.503-98.357-114.503c-46.697,0-86.652,40.321-96.29,95.396C95.139,188.996,75.1,164.417,70.731,143.56c-1.033-4.947-4.933-8.683-9.936-9.518c-4.923-0.823-9.735,1.366-12.333,5.579c-0.116,0.18-0.21,0.344-0.287,0.487c-8.978,15.282-11.588,33.751-7.811,52.788c-4.686-4.875-8.418-9.9-10.996-14.962c-2.297-4.498-7.044-7.077-12.088-6.572c-5.022,0.502-9.144,3.953-10.5,8.801l-0.047,0.17c-7.67,27.815,2.96,57.899,27.076,81.47c-5.247-2.475-9.847-5.33-13.638-8.552c-3.893-3.31-9.313-3.891-13.809-1.481c-4.399,2.358-6.863,7.083-6.276,12.036l0.034,0.276c2.977,23.833,18.146,44.562,42.713,58.368c18.833,10.583,41.506,16.112,65.323,16.111c6.442,0,12.972-0.405,19.526-1.223c15.844-1.979,30.252-5.563,42.955-10.496c14.35,7.672,31.206,11.714,48.975,11.714c26.114,0,49.632-8.628,66.982-24.424c16.946,15.588,39.94,24.427,67.025,24.427c58.916,0,98.5-41.794,98.5-104C452.118,230.969,449.208,228.059,445.618,228.059z M201.131,133.386c0,0.477-2,2.5-6,2.5c-3.508,0-5.476-1.555-5.908-2.259c2.088-1.007,4.215-1.91,6.375-2.711C199.273,131.07,201.131,132.928,201.131,133.386z" />
              </svg>
              ผลไม้
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {foodSummary.fruit.map((item) => (
                <div key={item.fruit_amount} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{amountLabels[item.fruit_amount]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        height: 6,
                        width: Math.max(20, (item.count / Math.max(...foodSummary.fruit.map((f) => f.count))) * 100),
                        background: item.fruit_amount === 'all' ? '#10b981' : item.fruit_amount === 'some' ? '#f59e0b' : '#94a3b8',
                        borderRadius: 3
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', minWidth: 30, textAlign: 'right' }}>{item.count} ครั้ง</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milk1 Statistics */}
        {foodSummary.milk1?.length > 0 && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" />
                <path d="M6 6h12" />
                <path d="M10 11v6M14 11v6" />
              </svg>
              นม มื้อ 1
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {foodSummary.milk1.map((item) => (
                <div key={item.milk_amount} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{amountLabels[item.milk_amount]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        height: 6,
                        width: Math.max(20, (item.count / Math.max(...foodSummary.milk1.map((f) => f.count))) * 100),
                        background: item.milk_amount === 'all' ? '#10b981' : item.milk_amount === 'some' ? '#f59e0b' : '#94a3b8',
                        borderRadius: 3
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', minWidth: 30, textAlign: 'right' }}>{item.count} ครั้ง</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milk2 Statistics */}
        {foodSummary.milk2?.length > 0 && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" />
                <path d="M6 6h12" />
                <path d="M10 11v6M14 11v6" />
              </svg>
              นม มื้อ 2
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {foodSummary.milk2.map((item) => (
                <div key={item.milk_amount} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{amountLabels[item.milk_amount]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        height: 6,
                        width: Math.max(20, (item.count / Math.max(...foodSummary.milk2.map((f) => f.count))) * 100),
                        background: item.milk_amount === 'all' ? '#10b981' : item.milk_amount === 'some' ? '#f59e0b' : '#94a3b8',
                        borderRadius: 3
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', minWidth: 30, textAlign: 'right' }}>{item.count} ครั้ง</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nap Statistics */}
        {foodSummary.nap?.total_days > 0 && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5" />
                <path d="M19 17a7 7 0 1 1-14 0" />
              </svg>
              การนอนกลางวัน
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>นอนทั้งหมด</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>
                  {foodSummary.nap.nap_days} / {foodSummary.nap.total_days} วัน
                </span>
              </div>
              {foodSummary.nap.avg_hours !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ระยะเวลาเฉลี่ย</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>
                    {Math.floor(foodSummary.nap.avg_hours)} ชม. {Math.round((foodSummary.nap.avg_hours % 1) * 60)} นาที
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Excretion Statistics */}
        {foodSummary.excretions?.length > 0 && (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              การขับถ่าย
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(() => {
                const peeTotal = foodSummary.excretions.filter((e) => e.type === 'pee').reduce((sum, e) => sum + e.count, 0);
                const pooTotal = foodSummary.excretions.filter((e) => e.type === 'poo').reduce((sum, e) => sum + e.count, 0);
                const diaperCount = foodSummary.excretions.filter((e) => e.action === 'diaper').reduce((sum, e) => sum + e.count, 0);
                const pottyCount = foodSummary.excretions.filter((e) => e.action === 'potty').reduce((sum, e) => sum + e.count, 0);

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        ปัสสาวะ
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{peeTotal} ครั้ง</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#b45309">
                          <ellipse cx="12" cy="14" rx="6" ry="6" />
                        </svg>
                        อุจจาระ
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{pooTotal} ครั้ง</span>
                    </div>
                    <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Diaper size={14} color="#6366f1" />
                        ผ้าอ้อม
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{diaperCount} ครั้ง</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Toilet size={14} color="#10b981" />
                        ส้วม
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{pottyCount} ครั้ง</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
