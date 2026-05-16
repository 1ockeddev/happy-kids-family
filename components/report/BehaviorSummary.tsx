'use client';
import React, { useState, useEffect, useCallback } from 'react';

/* ── types ── */
interface DailyScore { date: string; score: number }
interface ItemSummary {
  item_id: string; name_th: string; name_en: string; max_score: number;
  category_id: string; category_name_th: string; category_name_en: string;
  avg_score: number; min_score: number; max_score_val: number; days_recorded: number;
  daily_scores: DailyScore[];
}

interface Props { childId: string }

const RANGES = [
  { label: '7 วัน',  days: 7 },
  { label: '14 วัน', days: 14 },
  { label: '30 วัน', days: 30 },
  { label: 'ทั้งหมด',days: 0 },
];

/* ── Sparkline (pure SVG) ── */
function Sparkline({ data, maxScore, color }: { data: DailyScore[]; maxScore: number; color: string }) {
  if (data.length < 2) return null;
  const W = 80, H = 28, pad = 2;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (W - pad * 2));
  const ys = data.map(d => H - pad - ((d.score / maxScore) * (H - pad * 2)));
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  // fill polygon
  const fillPts = [`${xs[0]},${H - pad}`, ...xs.map((x, i) => `${x},${ys[i]}`), `${xs[xs.length-1]},${H - pad}`].join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
      <polygon points={fillPts} fill={color} opacity={0.12} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* last dot */}
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r={2.5} fill={color} />
    </svg>
  );
}

/* ── Score bar ── */
function ScoreBar({ avg, max }: { avg: number; max: number }) {
  const pct = Math.round((avg / max) * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>
        {avg.toFixed(1)}
      </span>
    </div>
  );
}

/* ── face icon by score ratio ── */
function FaceIcon({ ratio }: { ratio: number }) {
  if (ratio >= 0.8) return (
    <svg width={18} height={18} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" stroke="#10b981" strokeWidth="5"/>
      <path d="M28 38 Q34 28 40 38" stroke="#10b981" strokeWidth="4" strokeLinecap="round"/>
      <path d="M60 38 Q66 28 72 38" stroke="#10b981" strokeWidth="4" strokeLinecap="round"/>
      <path d="M28 58 Q50 82 72 58" stroke="#10b981" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
  if (ratio >= 0.5) return (
    <svg width={18} height={18} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" stroke="#3b82f6" strokeWidth="5"/>
      <circle cx="35" cy="38" r="4" fill="#3b82f6"/>
      <circle cx="65" cy="38" r="4" fill="#3b82f6"/>
      <path d="M35 58 Q50 72 65 58" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width={18} height={18} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" stroke="#f59e0b" strokeWidth="5"/>
      <circle cx="35" cy="38" r="4" fill="#f59e0b"/>
      <circle cx="65" cy="38" r="4" fill="#f59e0b"/>
      <line x1="35" y1="62" x2="65" y2="62" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Main ── */
export default function BehaviorSummary({ childId }: Props) {
  const [rangeIdx, setRangeIdx]   = useState(0);   // default 7 days
  const [items, setItems]         = useState<ItemSummary[]>([]);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null); // category_id

  const load = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    try {
      const days = RANGES[rangeIdx].days;
      let dateTo = '', dateFrom = '';
      if (days > 0) {
        const to   = new Date();
        const from = new Date(); from.setDate(from.getDate() - (days - 1));
        dateTo   = to.toISOString().slice(0,10);
        dateFrom = from.toISOString().slice(0,10);
      }
      const qs = new URLSearchParams({ child_id: childId, date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`/api/report/behavior-summary?${qs}`);
      const j   = await res.json();
      setItems(j.data ?? []);
      // auto-expand first category
      if ((j.data ?? []).length > 0) setExpanded(j.data[0].category_id);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [childId, rangeIdx]);

  useEffect(() => { load(); }, [load]);

  /* group by category */
  const groups = items.reduce<Record<string, { name_th: string; name_en: string; items: ItemSummary[] }>>((acc, s) => {
    if (!acc[s.category_id]) acc[s.category_id] = { name_th: s.category_name_th, name_en: s.category_name_en, items: [] };
    acc[s.category_id].items.push(s);
    return acc;
  }, {});

  /* category avg */
  const catAvg = (its: ItemSummary[]) => {
    const sum = its.reduce((a, b) => a + Number(b.avg_score), 0);
    return sum / its.length;
  };

  const Skeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 52, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  if (!childId) return null;

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ── Range selector ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {RANGES.map((r, i) => (
          <button key={r.label} onClick={() => setRangeIdx(i)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: rangeIdx === i ? 800 : 500,
              background: rangeIdx === i ? '#6366f1' : '#f1f5f9',
              color: rangeIdx === i ? 'white' : '#475569',
              transition: 'all .15s',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton /> : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>📊</p>
          <p style={{ fontSize: '0.9rem' }}>ยังไม่มีข้อมูลพฤติกรรมในช่วงนี้</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(groups).map(([catId, g]) => {
            const avg   = catAvg(g.items);
            const maxSc = Math.max(...g.items.map(i => i.max_score));
            const ratio = avg / maxSc;
            const isOpen = expanded === catId;

            return (
              <div key={catId}
                style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>

                {/* Category header — tap to expand */}
                <button onClick={() => setExpanded(isOpen ? null : catId)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <FaceIcon ratio={ratio} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{g.name_th}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{g.name_en}</div>
                  </div>
                  {/* mini sparkline across ALL items avg per day */}
                  <div style={{ flexShrink: 0 }}>
                    <Sparkline
                      data={buildCatSparkline(g.items)}
                      maxScore={maxSc}
                      color={ratio >= 0.8 ? '#10b981' : ratio >= 0.5 ? '#3b82f6' : '#f59e0b'}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>
                    {avg.toFixed(1)}
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round"
                    style={{ flexShrink: 0, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Expanded items */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 16px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {g.items.map(item => {
                        const itemRatio = Number(item.avg_score) / item.max_score;
                        return (
                          <div key={item.item_id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{item.name_th}</span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 6 }}>{item.name_en}</span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>
                                {item.days_recorded} วัน
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ScoreBar avg={Number(item.avg_score)} max={item.max_score} />
                              <Sparkline data={item.daily_scores} maxScore={item.max_score} color={itemRatio >= 0.8 ? '#10b981' : itemRatio >= 0.5 ? '#3b82f6' : '#f59e0b'} />
                            </div>
                            {/* dot score per day */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                              {item.daily_scores.slice(-14).map(ds => {
                                const r = ds.score / item.max_score;
                                const c = r >= 0.8 ? '#10b981' : r >= 0.5 ? '#3b82f6' : '#f59e0b';
                                return (
                                  <div key={ds.date} title={`${ds.date}: ${ds.score}/${item.max_score}`}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <div style={{ display: 'flex', gap: 1 }}>
                                      {Array.from({ length: item.max_score }, (_, i) => (
                                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i < ds.score ? c : '#f1f5f9' }} />
                                      ))}
                                    </div>
                                    <span style={{ fontSize: 9, color: '#cbd5e1' }}>
                                      {new Date(ds.date + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* average scores per date across all items in category */
function buildCatSparkline(items: ItemSummary[]): DailyScore[] {
  const map: Record<string, number[]> = {};
  items.forEach(item => {
    item.daily_scores.forEach(ds => {
      if (!map[ds.date]) map[ds.date] = [];
      map[ds.date].push(ds.score);
    });
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({ date, score: scores.reduce((a,b) => a+b, 0) / scores.length }));
}
