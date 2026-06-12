'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { 
      path: '/', 
      label: 'หน้าแรก',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    { 
      path: '/summary-behavior', 
      label: 'อุปนิสัย',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname === '/summary-behavior' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      )
    },
    { 
      path: '/summary-food-milk', 
      label: 'อาหาร นม',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
          <path d="M7 2v20"/>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
      )
    },
    { 
      path: '/summary-nap', 
      label: 'การนอน',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
          <path d="M19 17a7 7 0 1 1-14 0"/>
        </svg>
      )
    },
    { 
      path: '/summary-excretion', 
      label: 'ขับถ่าย',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 11h10M7 15h6"/>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
      )
    }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(226, 232, 240, 0.8)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0',
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
      zIndex: 1000
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            prefetch={true}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              padding: '6px 4px',
              transition: 'all 0.2s',
              color: isActive ? '#6366f1' : '#94a3b8',
              position: 'relative'
            }}
          >
            {item.icon}
            <span style={{ 
              fontSize: '0.6rem', 
              fontWeight: isActive ? 700 : 500 
            }}>
              {item.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                top: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 30,
                height: 3,
                background: '#6366f1',
                borderRadius: '0 0 3px 3px'
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
