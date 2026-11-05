import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.cookies.get('jwt')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const isPublicRoute = pathname === '/login' || pathname === '/signup';

  // If the user is trying to access a protected route without a session token, redirect to login
  if (!token && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and visits login/signup, push them to dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};