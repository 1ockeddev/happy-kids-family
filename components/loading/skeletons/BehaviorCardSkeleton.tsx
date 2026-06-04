import React from 'react';

export default function BehaviorCardSkeleton() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 16
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          {/* Icon skeleton */}
          <div className="shimmer" style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            flexShrink: 0
          }} />
          
          {/* Text skeleton */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="shimmer" style={{ width: '60%', height: 18 }} />
            <div className="shimmer" style={{ width: '40%', height: 14 }} />
          </div>
          
          {/* Score skeleton */}
          <div className="shimmer" style={{
            width: 60,
            height: 32,
            borderRadius: 8,
            flexShrink: 0
          }} />
        </div>
      ))}
    </div>
  );
}
