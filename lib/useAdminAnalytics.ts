import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

let sessionId: string | null = null;

// Generate or get session ID
function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Try to get from sessionStorage
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('admin_analytics_session_id');
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  }
  
  // Generate new session ID
  sessionId = `admin_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('admin_analytics_session_id', sessionId);
  }
  
  return sessionId;
}

// Track analytics event for admin
async function trackAdminEvent(data: {
  event_type: 'page_view' | 'click' | 'navigation';
  page_path: string;
  from_path?: string;
  to_path?: string;
  element_type?: string;
  element_label?: string;
  duration_seconds?: number;
}) {
  try {
    const response = await fetch('/api/analytics/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session
      body: JSON.stringify({
        ...data,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.debug('Admin analytics tracking failed:', response.status, error);
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug('Admin analytics tracking error:', error);
  }
}

// Hook to track admin page views
export function useAdminPageTracking() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only track if we're on admin path
    if (!pathname?.startsWith('/admin')) return;
    
    const currentPath = pathname;
    const previousPath = previousPathRef.current;
    
    // Track navigation event if there was a previous page
    if (previousPath && previousPath !== currentPath) {
      trackAdminEvent({
        event_type: 'navigation',
        page_path: currentPath,
        from_path: previousPath,
        to_path: currentPath,
      });
    }
    
    // Track page view
    trackAdminEvent({
      event_type: 'page_view',
      page_path: currentPath,
    });
    
    // Update refs
    startTimeRef.current = Date.now();
    previousPathRef.current = currentPath;
    
    // Track page duration on unmount
    return () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackAdminEvent({
        event_type: 'page_view',
        page_path: currentPath,
        duration_seconds: duration,
      });
    };
  }, [pathname]);
}

// Function to track admin click events
export function trackAdminClick(element_type: string, element_label: string, page_path?: string) {
  const currentPath = page_path || window.location.pathname;
  trackAdminEvent({
    event_type: 'click',
    page_path: currentPath,
    element_type,
    element_label,
  });
}
