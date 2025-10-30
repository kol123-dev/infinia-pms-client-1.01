import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define public routes that don't require authentication
const publicRoutes = [
  '/signin',
  '/signup',
  '/manifest.json',
];

// Define public asset paths
const publicAssets = [
  '/auth-background.jpg',
  '/google-icon.svg',
  '/placeholder-logo.png',
  '/placeholder-logo.svg',
  '/placeholder-user.jpg',
  '/placeholder.jpg',
  '/placeholder.svg'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow access to public routes and assets without authentication
  if (
    publicRoutes.includes(path) ||
    publicAssets.includes(path) ||
    path.startsWith('/icons/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  try {
    // Get the token using NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction 
      ? 'https://property.infiniasync.com' 
      : 'http://localhost:3000';
    
    if (!token) {
      const signInUrl = new URL('/signin', baseUrl);
      // Sanitize callbackUrl to match current environment base
      let callbackUrl = request.url;
      // Only rewrite to the chosen base host, not hard-coded production
      const targetHost = new URL(baseUrl).host;
      const parsed = new URL(callbackUrl);
      parsed.host = targetHost;
      parsed.protocol = new URL(baseUrl).protocol;
      // Remove dev port if switching to prod; keep dev port in dev
      if (isProduction) parsed.port = '';
      signInUrl.searchParams.set('callbackUrl', parsed.toString());
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    const signInUrl = new URL('/signin', request.url);
    return NextResponse.redirect(signInUrl);
  }
}

// Configure which routes should be protected by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}