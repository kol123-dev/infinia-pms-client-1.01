import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname
  const origin = url.origin
  // Use a stable base origin to avoid localhost redirects behind proxies
  const baseOrigin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || origin

  // Early bypass for Next assets and NextAuth and API routes
  if (path.startsWith('/_next') || path.startsWith('/api/auth') || path.startsWith('/api/v1')) {
    return NextResponse.next()
  }

    // Public routes should not trigger auth redirects
    const isPublicRoute = [
      '/signin',
      '/tenant/signin',
      '/signup',
      '/forgot-password',
      '/help',
      '/manifest.json',
    ].some((prefix) => path === prefix || path.startsWith(prefix))
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // Auth check
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
      const sessionCookie = 
        request.cookies.get('__Secure-next-auth.session-token') || 
        request.cookies.get('next-auth.session-token') ||
        request.cookies.get('__Host-next-auth.session-token')

      // Immediate redirect when there is no auth context at all
      if (!token && !sessionCookie) {
        console.log('[Middleware] No token or session cookie found. Redirecting to signin.')
        const wantsTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant')
        const signInPath = wantsTenantArea ? '/tenant/signin' : '/signin'

        if (path === signInPath) {
          return NextResponse.next()
        }

        const signInUrl = new URL(signInPath, baseOrigin)
        signInUrl.searchParams.set('callbackUrl', '/dashboard')
        return NextResponse.redirect(signInUrl)
      }

      // New: redirect if the JWT we carry is expired or close enough to be treated as expired
      // Redirect if our stored backend access token expiry has passed
      const tokenExpiry = (token as any)?.tokenExpiry as number | undefined
      if (typeof tokenExpiry === 'number' && Date.now() > tokenExpiry) {
        const wantsTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant')
        const signInPath = wantsTenantArea ? '/tenant/signin' : '/signin'
        const signInUrl = new URL(signInPath, baseOrigin)
        signInUrl.searchParams.set('callbackUrl', '/dashboard')
        return NextResponse.redirect(signInUrl)
      }

      const role = (token as any)?.role
      if (path === '/dashboard' && role === 'tenant') {
        return NextResponse.redirect(new URL('/dashboard/tenant', baseOrigin))
      }
      if (path.startsWith('/dashboard/tenant') && role !== 'tenant') {
        return NextResponse.redirect(new URL('/dashboard', baseOrigin))
      }

      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    } catch (error) {
      // Fallback: plain signin without callback loop
      return NextResponse.redirect(new URL('/signin', baseOrigin))
    }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)'
  ]
}