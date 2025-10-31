"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import api from '@/lib/axios' // ✅ Add this import to fix TS2304

export default function SignInContent({ defaultCallback = '/dashboard', signInSource, headerLabel }: { defaultCallback?: string, signInSource?: 'tenant' | 'default', headerLabel?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || defaultCallback
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const isTenantPage = signInSource === 'tenant'

    const handleEmailSignIn = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        setLoading(true)
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          signInSource, // NEW: tells backend where this login came from
        })

        if (result?.error) {
          // For credential failures, present a helpful link
          setError(result.error)
        } else {
          // Use axios client to set Django session cookie on the SAME base URL
          const session = await fetch('/api/auth/session').then(res => res.json())
          const firebaseToken = session?.firebaseToken
          if (firebaseToken) {
            await api.post('/auth/firebase-login/', { id_token: firebaseToken.trim() }) // ✅ uses axios client
          }
          router.push(callbackUrl)
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An error occurred during sign in')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row">
        {/* Left side - Updated Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            {/* Brand/Logo Text */}
            <div className="text-left text-primary font-semibold text-xl">
              Infinia
            </div>

            {/* Optional header label for tenant page */}
            {headerLabel && (
              <div className="text-sm font-semibold text-primary/80">
                {headerLabel}
              </div>
            )}

            {/* Tenant hint only on generic /signin */}
            {!isTenantPage && (
              <div className="text-sm">
                Are you a tenant?{' '}
                <Link href="/tenant/signin" className="text-primary hover:underline">
                  Click here to login as a tenant
                </Link>
              </div>
            )}

            {/* Larger Heading and Subtext */}
            <div className="space-y-3">
              <h2 className="text-5xl font-bold leading-tight">Hi, Welcome Back</h2>
              <p className="text-muted-foreground text-lg">You're just a few taps away.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <Input
                type="email"
                placeholder="imani@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 text-base rounded-lg"
              />

              {/* Password field with eye toggle */}
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 text-base rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Remember Me and Forgot Password row */}
              <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe} 
                    onCheckedChange={(checked) => setRememberMe(!!checked)} 
                  />
                  <Label htmlFor="remember" className="text-muted-foreground">Remember me</Label>
                </div>
                <Link href="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Sign in failed. If you are a tenant,{' '}
                    <Link href="/tenant/signin" className="text-primary underline">
                      click here to login as a tenant
                    </Link>.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden md:block w-1/2 bg-black relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/auth-background.jpg"
              alt="Authentication background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Refine Your Potential</h2>
              <p className="text-lg">Start Now!</p>
            </div>
          </div>
        </div>
      </div>
    )
}