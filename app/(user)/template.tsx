'use client';

// This template prevents full page reloads between user pages
export default function UserTemplate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
