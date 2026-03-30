import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Protect all routes except /login and /api/auth/login
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth/login')) {
    if (authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/clients (if you want these public, but usually they should be protected too)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg (logo files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)',
  ],
};
