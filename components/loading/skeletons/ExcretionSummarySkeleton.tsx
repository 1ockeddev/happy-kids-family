import React from 'react';

export default function ExcretionSummarySkeleton() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 16
    }}>
      {/* Summary cards skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            background: 'white',
            padding: 16,
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}>
            <div className="shimmer" style={{
              width: 40,
              height: 40,
              borderRadius: '50%'
            }} />
            <div className="shimmer" style={{ width: 80, height: 14 }} />
            <div className="shimmer" style={{ width: 50, height: 20 }} />
          </div>
        ))}
      </div>

      {/* Records skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: 'white',
          padding: 16,
          borderRadius: 16,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="shimmer" style={{ width: 100, height: 16 }} />
            <div className="shimmer" style={{ width: 60, height: 14 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="shimmer" style={{ width: '100%', height: 36, borderRadius: 8 }} />
            <div className="shimmer" style={{ width: '100%', height: 36, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
