import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define public routes that don't require authentication
const publicRoutes = [
  '/signin',
  '/tenant/signin', // NEW
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
    const baseUrl = isProduction ? 'https://property.infiniasync.com' : 'http://localhost:3000';

    if (!token) {
      // NEW: choose sign-in based on route
      const wantsTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant');
      const signInPath = wantsTenantArea ? '/tenant/signin' : '/signin';
      const signInUrl = new URL(signInPath, baseUrl);

      // Preserve callbackUrl to return after login
      let callbackUrl = request.url;
      const targetHost = new URL(baseUrl).host;
      const parsed = new URL(callbackUrl);
      parsed.host = targetHost;
      parsed.protocol = new URL(baseUrl).protocol;
      if (isProduction) parsed.port = '';
      signInUrl.searchParams.set('callbackUrl', parsed.toString());
      return NextResponse.redirect(signInUrl);
    }

    const role = (token as any)?.role;

    // If signed in already and visiting generic signin, route to proper dashboard
    if ((path === '/signin' || path === '/tenant/signin') && role) {
      const dest = role === 'tenant' ? '/dashboard/tenant' : '/dashboard';
      const url = new URL(dest, baseUrl);
      return NextResponse.redirect(url);
    }

    // NEW: tenants hitting the generic admin dashboard should be moved to tenant dashboard
    if (role === 'tenant' && path === '/dashboard') {
      const url = new URL('/dashboard/tenant', baseUrl);
      return NextResponse.redirect(url);
    }

    // Block tenants from management/agent/landlord pages, but allow their own dashboard
    if (role === 'tenant') {
      const blockedPrefixes = [
        '/tenants',
        '/users',
        '/properties',
        '/landlords',
        '/units',
        '/invoice',
        '/reports',
        '/expenses',
        '/sms',
      ];
      const isBlocked = blockedPrefixes.some(prefix => path.startsWith(prefix));
      if (isBlocked) {
        const url = new URL('/dashboard/tenant', baseUrl);
        return NextResponse.redirect(url);
      }
    }

    // Add cache control for protected routes to prevent unauthorized cached access
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
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