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

  // Allow access to public routes, assets, and all /icons/ paths without authentication
  if (
    publicRoutes.includes(path) ||
    publicAssets.includes(path) ||
    path.startsWith('/icons/')  // Add this to allow all icons
  ) {
    return NextResponse.next();
  }

  // Get the token using NextAuth
  const token = await getToken({ req: request });

  // Redirect to signin if no token is present
  if (!token) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(signinUrl);
  }

  // Allow access to protected routes if token exists
  return NextResponse.next();
}

// Configure which routes should be protected by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. /_next/data (Next.js data files)
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico).*)',
  ],
}