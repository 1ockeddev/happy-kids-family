import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  size?: number;
}

export default function LoadingIndicator({ 
  message = 'กำลังโหลดข้อมูล...', 
  size = 40 
}: LoadingIndicatorProps) {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        minHeight: 200
      }}
      role="status"
      aria-label={message}
    >
      <div 
        style={{
          width: size,
          height: size,
          border: '3px solid #6366f1',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {message && (
        <p style={{
          fontSize: '0.85rem',
          color: '#94a3b8',
          fontWeight: 500
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
