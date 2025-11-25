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

      if (!token) {
        const wantsTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant')
        const signInPath = wantsTenantArea ? '/tenant/signin' : '/signin'

        // Avoid recursive sign-in -> sign-in
        if (path === signInPath) {
          return NextResponse.next()
        }

        const signInUrl = new URL(signInPath, origin)
        signInUrl.searchParams.set('callbackUrl', '/dashboard')
        return NextResponse.redirect(signInUrl)
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