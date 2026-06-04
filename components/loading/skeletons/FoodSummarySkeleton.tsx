import React from 'react';

export default function FoodSummarySkeleton() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 16
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            background: 'white',
            padding: 16,
            borderRadius: 16,
            border: '1px solid #e2e8f0'
          }}
        >
          {/* Title skeleton */}
          <div className="shimmer" style={{
            width: 140,
            height: 18,
            marginBottom: 12
          }} />
          
          {/* Items skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2].map((j) => (
              <div key={j} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="shimmer" style={{ width: 80, height: 14 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="shimmer" style={{ width: 100, height: 8, borderRadius: 4 }} />
                  <div className="shimmer" style={{ width: 60, height: 16 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
