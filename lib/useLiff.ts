'use client';
import { useState, useEffect } from 'react';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface LiffState {
  ready: boolean;
  isInLiff: boolean;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  error: string | null;
}

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? '';

// Mock profile สำหรับทดสอบ local
// ใส่ line_user_id จริงที่มีอยู่ใน DB ได้เลย
const DEV_MOCK_LINE_USER_ID = process.env.NEXT_PUBLIC_DEV_LINE_USER_ID ?? '';

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    ready: false,
    isInLiff: false,
    isLoggedIn: false,
    profile: null,
    error: null,
  });

  useEffect(() => {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1');

    // ── Dev mode: localhost + ไม่มี LIFF_ID ────────────
    if (isLocalhost && !LIFF_ID) {
      setState({
        ready: true,
        isInLiff: false,
        isLoggedIn: !!DEV_MOCK_LINE_USER_ID,
        profile: DEV_MOCK_LINE_USER_ID
          ? {
              userId:      DEV_MOCK_LINE_USER_ID,
              displayName: '(Dev) ผู้ปกครองทดสอบ',
              pictureUrl:  undefined,
            }
          : null,
        error: null,
      });
      return;
    }

    // ── Production: ใช้ LIFF จริง ───────────────────────
    if (!LIFF_ID) {
      setState({ ready: true, isInLiff: false, isLoggedIn: false, profile: null, error: null });
      return;
    }

    import('@line/liff').then(({ default: liff }) => {
      liff.init({ liffId: LIFF_ID })
        .then(async () => {
          const isInClient = liff.isInClient();
          const isLoggedIn = liff.isLoggedIn();

          if (!isLoggedIn) {
            liff.login({ redirectUri: window.location.href });
            return;
          }

          const profile = await liff.getProfile();
          setState({
            ready: true,
            isInLiff: isInClient,
            isLoggedIn: true,
            profile: {
              userId:      profile.userId,
              displayName: profile.displayName,
              pictureUrl:  profile.pictureUrl,
            },
            error: null,
          });
        })
        .catch(err => {
          setState(s => ({ ...s, ready: true, error: err.message ?? 'LIFF init ล้มเหลว' }));
        });
    });
  }, []);

  return state;
}
