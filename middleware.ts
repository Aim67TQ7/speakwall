import { NextResponse, NextRequest } from 'next/server';

// Minimal protected routes middleware. In production, wire this to Supabase auth cookies.
const protectedPaths = new Set(['/dashboard', '/record']);

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (protectedPaths.has(url.pathname)) {
    const hasSession = req.cookies.get('psim-session')?.value; // placeholder cookie
    if (!hasSession) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/record']
};

