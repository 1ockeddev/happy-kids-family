import { useRouter } from 'next/navigation';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import BehaviorCardSkeleton from '@/components/loading/skeletons/BehaviorCardSkeleton';
import { BehaviorSummaryItem, DayEntry } from './types';

interface BehaviorSummaryProps {
  behaviorSummary: BehaviorSummaryItem[];
  summaryLoading: boolean;
  showSummaryShimmer: boolean;
  childId: string | null;
  enrollmentPeriod: { start: string; end: string | null } | null;
  dayEntries: DayEntry[];
  onDaySelect: (idx: number) => void;
}

export default function BehaviorSummary({
  behaviorSummary,
  summaryLoading,
  showSummaryShimmer,
  childId,
  enrollmentPeriod,
  dayEntries,
  onDaySelect
}: BehaviorSummaryProps) {
  const router = useRouter();

  return (
    <LoadingWrapper
      isLoading={summaryLoading}
      hasData={behaviorSummary.length > 0}
      showShimmer={showSummaryShimmer}
      showEmptyState={!!childId && !!enrollmentPeriod}
      shimmerComponent={<BehaviorCardSkeleton />}
    >
      <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🌟 สรุปอุปนิสัย
            </span>
            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>คะแนนเฉลี่ยตลอดช่วงเรียน</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(() => {
            // Group by category
            const grouped = behaviorSummary.reduce<Record<string, typeof behaviorSummary>>((acc, item) => {
              if (!acc[item.category_name_th]) acc[item.category_name_th] = [];
              acc[item.category_name_th].push(item);
              return acc;
            }, {});

            return Object.entries(grouped).map(([categoryName, items]) => (
              <div key={categoryName} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Category header */}
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {categoryName}
                </div>
                {/* Items in category */}
                {items.map((item) => {
                  const percentage = (item.avg_score / item.max_score) * 100;
                  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

                  return (
                    <div
                      key={item.item_id}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8, background: '#fafafa', padding: 12, borderRadius: 10 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{item.name_th}</span>
                      </div>

                      {/* Sparkline bar chart */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 24 }}>
                        {item.daily_scores.slice(-14).map((day, idx) => {
                          const barHeight = (day.score / item.max_score) * 100;
                          const barColor = day.score / item.max_score >= 0.8 ? '#10b981' : day.score / item.max_score >= 0.6 ? '#f59e0b' : '#ef4444';
                          return (
                            <div
                              key={idx}
                              title={`${day.date}: ${day.score}/${item.max_score}`}
                              onClick={() => {
                                // Find the dayIdx for this date
                                const foundIdx = dayEntries.findIndex((entry) => entry.date === day.date);
                                if (foundIdx >= 0) {
                                  onDaySelect(foundIdx);
                                  router.push('/');
                                }
                              }}
                              style={{
                                flex: 1,
                                height: `${barHeight}%`,
                                minHeight: 2,
                                background: barColor,
                                borderRadius: 1,
                                opacity: 0.7,
                                transition: 'opacity 0.2s',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      </div>
    </LoadingWrapper>
  );
}
