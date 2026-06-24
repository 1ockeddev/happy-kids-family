'use client';
import { ReactNode } from 'react';
import { useUserApp } from './UserAppProvider';
import { useProfileSync } from '@/lib/useProfileSync';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';

interface UserLayoutProps {
  children: ReactNode;
  subtitle?: string;
}

export default function UserLayout({ children, subtitle }: UserLayoutProps) {
  // Auto-sync profile when app opens
  useProfileSync();

  const {
    currentUser,
    liffReady,
    notRegistered,
    children: childrenList,
    parents,
    childId,
    parentId,
    childLoading,
    enrollmentPeriod,
    cohorts,
    cohortId,
    setCohortId,
    setChildId,
    setParentId
  } = useUserApp();

  const parseLocalDate = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const finalSubtitle = subtitle || (enrollmentPeriod 
    ? `${parseLocalDate(enrollmentPeriod.start).toLocaleDateString('th-TH')} - ${enrollmentPeriod.end ? parseLocalDate(enrollmentPeriod.end).toLocaleDateString('th-TH') : 'ปัจจุบัน'}`
    : undefined);

  if (!liffReady) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#f8fafc' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (notRegistered && !childLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 340, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>ยังไม่มีข้อมูล</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100dvh', display: 'flex', justifyContent: 'center' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .avatar-row{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
        .avatar-row::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{ width: '100%', maxWidth: 480, background: 'white', minHeight: '100dvh', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
        
        <AppHeader
          parents={parents}
          children={childrenList}
          parentId={parentId}
          childId={childId}
          childLoading={childLoading}
          currentUser={currentUser}
          onParentSelect={setParentId}
          onChildSelect={setChildId}
          cohorts={cohorts}
          cohortId={cohortId}
          onCohortSelect={setCohortId}
          subtitle={finalSubtitle}
        />

        {children}

        <BottomNavigation />
      </div>
    </div>
  );
}
