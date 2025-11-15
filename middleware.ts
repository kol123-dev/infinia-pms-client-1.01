import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    // Define path and base URL
    const url = request.nextUrl
    const path = url.pathname
    const baseUrl = url.origin

    // Bypass framework/static assets and NextAuth endpoints
    if (
      path.startsWith('/_next') ||
      path.startsWith('/static') ||
      path === '/favicon.ico' ||
      path.startsWith('/icons') ||
      path === '/manifest.json') {
      return NextResponse.next()
    }
    const assetRegex = /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|woff2?|ttf|otf)$/
    if (assetRegex.test(path)) {
      return NextResponse.next()
    }
    if (path.startsWith('/api/auth')) {
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

        const signInUrl = new URL(signInPath, baseUrl)
        // Keep callbackUrl simple to avoid nested chains
        signInUrl.searchParams.set('callbackUrl', '/dashboard')

        return NextResponse.redirect(signInUrl)
      }

      // Optional: role-based redirects (ensure they don’t loop)
      // const role = (token as any)?.role
      // if (role === 'tenant' && path === '/dashboard') {
      //   return NextResponse.redirect(new URL('/dashboard/tenant', baseUrl))
      // }

      // Protected route cache headers
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    } catch (error) {
      console.error('Middleware authentication error:', error)
      // Fallback: plain signin without callback loop
      return NextResponse.redirect(new URL('/signin', baseUrl))
    }
}
