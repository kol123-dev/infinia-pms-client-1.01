import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname
  const origin = url.origin

  // Early bypass for Next assets and NextAuth
  if (path.startsWith('/_next') || path.startsWith('/api/auth')) {
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

      if (!token && !sessionCookie) {
        console.log('[Middleware] No token or session cookie found. Redirecting to signin.')
        const wantsTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant')
        const signInPath = wantsTenantArea ? '/tenant/signin' : '/signin'

        if (path === signInPath) {
          return NextResponse.next()
        }

        const signInUrl = new URL(signInPath, origin)
        signInUrl.searchParams.set('callbackUrl', '/dashboard')
        return NextResponse.redirect(signInUrl)
      }

      const role = (token as any)?.role
      if (path === '/dashboard' && role === 'tenant') {
        return NextResponse.redirect(new URL('/dashboard/tenant', origin))
      }
      if (path.startsWith('/dashboard/tenant') && role !== 'tenant') {
        return NextResponse.redirect(new URL('/dashboard', origin))
      }

      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    } catch (error) {
      // Fallback: plain signin without callback loop
      return NextResponse.redirect(new URL('/signin', origin))
    }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)'
  ]
}
