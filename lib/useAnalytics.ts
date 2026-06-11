import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useLiff } from './useLiff';

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track analytics event
const trackEvent = async (data: {
  event_type: 'page_view' | 'click' | 'navigation';
  page_path: string;
  from_path?: string;
  to_path?: string;
  element_type?: string;
  element_label?: string;
  duration_seconds?: number;
}, lineUserId?: string) => {
  if (typeof window === 'undefined') return;

  try {
    const session_id = getSessionId();
    const user_agent = navigator.userAgent;
    const viewport_width = window.innerWidth;
    const viewport_height = window.innerHeight;

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (lineUserId) {
      headers['x-line-user-id'] = lineUserId;
    }

    await fetch('/api/analytics', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...data,
        session_id,
        user_agent,
        viewport_width,
        viewport_height,
      }),
    });
  } catch (error) {
    // Silent fail - don't break user experience
    console.error('Analytics tracking failed:', error);
  }
};

export function useAnalytics() {
  const pathname = usePathname();
  const liff = useLiff();
  const previousPathRef = useRef<string>('');
  const pageStartTimeRef = useRef<number>(0);
  const lineUserIdRef = useRef<string>('');

  // Get LINE user ID
  useEffect(() => {
    if (liff.ready && liff.profile?.userId) {
      lineUserIdRef.current = liff.profile.userId;
    }
  }, [liff.ready, liff.profile?.userId]);

  // Track page view
  useEffect(() => {
    const currentPath = pathname || '/';
    const previousPath = previousPathRef.current;
    const lineUserId = lineUserIdRef.current;

    // Record page start time
    pageStartTimeRef.current = Date.now();

    // Track navigation if there was a previous page
    if (previousPath && previousPath !== currentPath) {
      trackEvent({
        event_type: 'navigation',
        page_path: currentPath,
        from_path: previousPath,
        to_path: currentPath,
      }, lineUserId);
    }

    // Track page view
    trackEvent({
      event_type: 'page_view',
      page_path: currentPath,
    }, lineUserId);

    // Update previous path
    previousPathRef.current = currentPath;

    // Cleanup: track page duration when leaving
    return () => {
      const duration = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
      
      // Only track if duration is reasonable (between 1 second and 1 hour)
      if (duration >= 1 && duration <= 3600) {
        trackEvent({
          event_type: 'page_view',
          page_path: currentPath,
          duration_seconds: duration,
        }, lineUserId);
      }
    };
  }, [pathname]);

  // Track click events
  const trackClick = useCallback((
    element_type: string,
    element_label: string
  ) => {
    const currentPath = pathname || '/';
    const lineUserId = lineUserIdRef.current;
    trackEvent({
      event_type: 'click',
      page_path: currentPath,
      element_type,
      element_label,
    }, lineUserId);
  }, [pathname]);

  return { trackClick };
}
