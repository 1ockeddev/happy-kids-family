import React from 'react';

interface EmptyStateProps {
  message?: string;
  icon?: string;
  description?: string;
}

export default function EmptyState({ 
  message = 'ไม่มีข้อมูล',
  icon = '📋',
  description
}: EmptyStateProps) {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        minHeight: 200,
        textAlign: 'center'
      }}
      role="status"
      aria-label={message}
    >
      <p style={{ fontSize: 48, marginBottom: 12 }}>{icon}</p>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: description ? 8 : 0
      }}>
        {message}
      </h3>
      {description && (
        <p style={{
          fontSize: '0.85rem',
          color: '#94a3b8',
          lineHeight: 1.6
        }}>
          {description}
        </p>
      )}
    </div>
  );
}
