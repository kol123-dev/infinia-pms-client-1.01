"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import Image from 'next/image'

// Helper: map NextAuth error codes to friendly messages
function getFriendlyError(code?: string | null) {
  if (!code) return ''
  switch (code) {
    case 'CredentialsSignin': return 'Invalid email or password.'
    case 'AccessDenied': return 'Access denied. Please try again.'
    case 'OAuthSignin': return 'Sign in failed. Please try again.'
    case 'OAuthCallback': return 'Sign in callback failed.'
    default: return code
  }
}

export default function SignInContent({
  defaultCallback = '/dashboard',
  signInSource,
  headerLabel,
  initialSearchParams,
  initialPathname,
}: {
  defaultCallback?: string
  signInSource?: 'tenant' | 'landlord'
  headerLabel?: string
  initialSearchParams?: { callbackUrl?: string | null; error?: string | null }
  initialPathname?: string
}) {
  const router = useRouter()

  // Resolve initial values from server snapshot so SSR and client match
  const resolvedPathname = initialPathname ?? '/signin'
  const resolvedSignInSource = signInSource ?? (resolvedPathname.includes('/tenant') ? 'tenant' : 'landlord')
  const isTenantPage = resolvedSignInSource === 'tenant'
  const resolvedHeaderLabel = headerLabel ?? (isTenantPage ? 'Tenant Login' : undefined)
  const callbackUrl = initialSearchParams?.callbackUrl ?? defaultCallback
  const qsError = initialSearchParams?.error ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Seed error synchronously so SSR and client render the same DOM
  const [error, setError] = useState(getFriendlyError(qsError))
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Prefetch the post-login route for faster redirect
  useEffect(() => {
    try {
      router.prefetch(callbackUrl)
    } catch {}
  }, [callbackUrl, router])

  // Remove the client-only error mapping effect to avoid hydration mismatch
  useEffect(() => {
    const code = qsError
    if (!code) return
    const friendly =
      code === 'CredentialsSignin' ? 'Invalid email or password.' :
      code === 'AccessDenied' ? 'Access denied. Please try again.' :
      code === 'OAuthSignin' ? 'Sign in failed. Please try again.' :
      code === 'OAuthCallback' ? 'Sign in callback failed.' :
      code
    setError(friendly)
  }, [qsError])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((rs) => {
        if (rs.length) {
          rs.forEach((r) => r.unregister())
          setTimeout(() => {
            if (typeof window !== 'undefined') window.location.reload()
          }, 50)
        }
      })
    }
  }, [])
      
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await signIn('credentials', {
        email,
        password,
        signInSource: resolvedSignInSource,
        callbackUrl,
        redirect: true, // let NextAuth handle the navigation
      })
      // No manual router.push — navigation handled by NextAuth
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Network error during sign in')
    } finally {
      setLoading(false)
    }
  }

  // Clear error when user edits input
  return (
    <div className="min-h-[100svh] md:min-h-screen w-full flex flex-col md:flex-row">
      {/* Left side - form */}
      <div className="w-full md:w-1/2 px-4 py-6 sm:px-6 md:p-10 flex items-center justify-center">
        <div className="relative w-full max-w-md space-y-8" aria-busy={loading}>
          <div className="text-left text-primary font-semibold text-xl">Infinia</div>
          {resolvedHeaderLabel && (
            <div className="text-sm font-semibold text-primary/80">{resolvedHeaderLabel}</div>
          )}
          {!isTenantPage && (
            <div className="text-sm">
              Are you a tenant?{' '}
              <Link href="/tenant/signin" className="text-primary hover:underline">
                Click here to login as a tenant
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Hi, Welcome Back</h2>
            <p className="text-muted-foreground text-base sm:text-lg">You're just a few taps away.</p>
          </div>

          
          <form onSubmit={handleEmailSignIn} className="space-y-6">
            <Input
              type="email"
              placeholder="imani@gmail.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
              required
              disabled={loading}
              className="w-full h-12 text-base rounded-lg"
            />

            
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                required
                disabled={loading}
                className="w-full h-12 text-base rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            
            <div className="flex items-center justify-between text-sm mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-muted-foreground">Remember me</Label>
              </div>
              <Link href="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription aria-live="polite">
                  {error}{' '}
                  {!isTenantPage && (
                    <>
                      If you are a tenant,{' '}
                      <Link href="/tenant/signin" className="text-primary underline">
                        click here to login as a tenant
                      </Link>.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>

          
          {loading && (
            <div className="pointer-events-none absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-lg flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Right side - image and overlay */}
      <div
        className="hidden md:block w-1/2 relative h-[100svh] md:h-screen overflow-hidden"
        aria-hidden="true"
      >
        <Image
          src="/auth-background.jpg"
          alt="Modern building"
          fill
          sizes="(min-width: 768px) 50vw, 0vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-sm text-center space-y-4 px-6">
            <h3 className="text-2xl font-semibold tracking-tight">Secure, fast sign-in</h3>
            <p className="text-sm text-muted-foreground">
              Manage properties, tenants, and payments in one place.
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="rounded-lg border bg-background/60 px-3 py-2">Encrypted credentials</div>
              <div className="rounded-lg border bg-background/60 px-3 py-2">Two-step verification ready</div>
              <div className="rounded-lg border bg-background/60 px-3 py-2">Role-based access</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}