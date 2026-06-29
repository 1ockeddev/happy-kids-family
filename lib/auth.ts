import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_session';
const MAX_AGE     = 60 * 60 * 8; // 8 hours

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

export async function createSession(username: string): Promise<string> {
  // Check if user is super admin from env
  const role = isSuperAdmin(username) ? 'super_admin' : 'admin';
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export function isSuperAdmin(username: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  // Super admin must have both username and password set in env
  return !!adminUsername && !!adminPassword && username === adminUsername;
}

export function checkSuperAdmin(session: { username: string; role: string } | null): boolean {
  if (!session) return false;
  return session.role === 'super_admin' || isSuperAdmin(session.username);
}

export async function verifySession(token: string) {
  // guard: JWT ต้องเป็น string ที่มี 3 ส่วนคั่นด้วย "." เท่านั้น
  if (!token || token.split('.').length !== 3) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { username: string; role: string };
  } catch {
    // ครอบ error ทุกแบบ: InvalidCompactJWS, expired, wrong secret ฯลฯ
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromRequest(req: NextRequest): Promise<{ username: string; role: string } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}
