'use client';
import { useEffect, useRef } from 'react';
import liff from '@line/liff';

export function useProfileSync() {
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only run once
    if (syncedRef.current) return;
    
    const syncProfile = async () => {
      try {
        // Check if LIFF is initialized
        if (!liff.isLoggedIn()) {
          console.log('[Profile Sync] User not logged in');
          return;
        }

        // Get LINE profile from LIFF
        const profile = await liff.getProfile();
        
        if (!profile || !profile.userId) {
          console.log('[Profile Sync] No profile data');
          return;
        }

        console.log('[Profile Sync] Got LIFF profile:', {
          userId: profile.userId,
          displayName: profile.displayName,
          hasPicture: !!profile.pictureUrl
        });

        // Call sync API
        const response = await fetch('/api/line/sync-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Profile Sync] Success:', data);
          syncedRef.current = true;
        } else {
          const error = await response.json();
          console.error('[Profile Sync] Failed:', error);
        }
      } catch (error) {
        console.error('[Profile Sync] Error:', error);
      }
    };

    // Delay sync to not block app loading
    const timer = setTimeout(() => {
      syncProfile();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}
