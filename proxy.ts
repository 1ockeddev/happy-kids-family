import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();

  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  } catch {
    // cookie เสียหาย / JWT ไม่ valid → redirect ไป login และลบ cookie
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('admin_session');
    return res;
  }
}

export const config = { matcher: ['/admin/:path*'] };
