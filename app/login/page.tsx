'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') ?? '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'เกิดข้อผิดพลาด'); return; }
      router.push(from);
      router.refresh();
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Sarabun, Prompt, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #E8754A, #d6623a)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, marginBottom: 16,
            boxShadow: '0 8px 32px rgba(232,117,74,0.35)',
          }}>
            🌻
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: 0, fontFamily: 'Prompt, sans-serif', letterSpacing: -0.5 }}>
            KinderCare
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>Admin Panel · เข้าสู่ระบบ</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '32px 28px',
          backdropFilter: 'blur(12px)',
        }}>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(232,92,92,0.15)', border: '1px solid rgba(232,92,92,0.3)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              color: '#fca5a5', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              ชื่อผู้ใช้
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="username"
              autoComplete="username"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)', color: 'white',
                fontSize: 15, outline: 'none', fontFamily: 'inherit',
                transition: 'border-color .15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#E8754A'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              รหัสผ่าน
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)', color: 'white',
                  fontSize: 15, outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color .15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#E8754A'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 16, padding: 4 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              cursor: loading ? 'default' : 'pointer', fontSize: 15, fontWeight: 700,
              fontFamily: 'inherit', transition: 'all .15s',
              background: loading ? '#6B7280' : 'linear-gradient(135deg, #E8754A, #d6623a)',
              color: 'white',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(232,117,74,0.4)',
            }}>
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 20 }}>
          สำหรับผู้ดูแลระบบเท่านั้น ·{' '}
          <a href="/report" style={{ color: '#6366f1', textDecoration: 'none' }}>หน้าผู้ปกครอง →</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
