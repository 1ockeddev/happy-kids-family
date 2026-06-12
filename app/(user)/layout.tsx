'use client';
import { UserAppProvider } from '@/components/UserAppProvider';

export default function UserPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserAppProvider>
      {children}
    </UserAppProvider>
  );
}
