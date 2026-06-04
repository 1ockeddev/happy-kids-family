import React from 'react';

export default function NapSummarySkeleton() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 16
    }}>
      {/* Summary card skeleton */}
      <div style={{
        background: 'white',
        padding: 20,
        borderRadius: 16,
        border: '1px solid #e2e8f0'
      }}>
        <div className="shimmer" style={{
          width: 120,
          height: 20,
          marginBottom: 16
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="shimmer" style={{ width: 100, height: 16 }} />
            <div className="shimmer" style={{ width: 80, height: 16 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="shimmer" style={{ width: 120, height: 16 }} />
            <div className="shimmer" style={{ width: 70, height: 16 }} />
          </div>
        </div>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="shimmer" style={{ width: '48%', height: 40, borderRadius: 8 }} />
            <div className="shimmer" style={{ width: '48%', height: 40, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
