import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

let sessionId: string | null = null;

// Generate or get session ID
function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Try to get from sessionStorage
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  }
  
  // Generate new session ID
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  
  return sessionId;
}

// Track analytics event
async function trackEvent(data: {
  event_type: 'page_view' | 'click' | 'navigation';
  page_path: string;
  from_path?: string;
  to_path?: string;
  element_type?: string;
  element_label?: string;
  duration_seconds?: number;
}) {
  try {
    // Get LINE user ID from localStorage (set by LIFF)
    const liffData = localStorage.getItem('liff_data');
    let lineUserId: string | null = null;
    
    if (liffData) {
      try {
        const parsed = JSON.parse(liffData);
        lineUserId = parsed.userId || null;
      } catch {
        // Ignore parse errors
      }
    }
    
    // If no LINE user ID, don't track (not logged in)
    if (!lineUserId) {
      return;
    }
    
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-line-user-id': lineUserId,
      },
      body: JSON.stringify({
        ...data,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      }),
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug('Analytics tracking failed:', error);
  }
}

// Hook to track page views
export function usePageTracking() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = pathname || '/';
    const previousPath = previousPathRef.current;
    
    // Track navigation event if there was a previous page
    if (previousPath && previousPath !== currentPath) {
      trackEvent({
        event_type: 'navigation',
        page_path: currentPath,
        from_path: previousPath,
        to_path: currentPath,
      });
    }
    
    // Track page view
    trackEvent({
      event_type: 'page_view',
      page_path: currentPath,
    });
    
    // Update refs
    startTimeRef.current = Date.now();
    previousPathRef.current = currentPath;
    
    // Track page duration on unmount
    return () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackEvent({
        event_type: 'page_view',
        page_path: currentPath,
        duration_seconds: duration,
      });
    };
  }, [pathname]);
}

// Function to track click events
export function trackClick(element_type: string, element_label: string, page_path?: string) {
  const currentPath = page_path || window.location.pathname;
  trackEvent({
    event_type: 'click',
    page_path: currentPath,
    element_type,
    element_label,
  });
}
