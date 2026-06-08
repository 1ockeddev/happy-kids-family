interface EmptyStateProps {
  message?: string;
  description?: string;
}

export default function EmptyState({ 
  message = 'ไม่มีข้อมูล',
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
      <svg 
        width="64" 
        height="64" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#94a3b8" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ marginBottom: 16 }}
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="15" y2="16" />
      </svg>
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
