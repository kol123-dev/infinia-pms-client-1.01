"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox' // Add this import if not present
import { Label } from '@/components/ui/label' // Add if needed for checkbox
import Image from 'next/image' // Add this import to fix Image component errors
import { Eye, EyeOff } from 'lucide-react' // Add for password toggle icons (install lucide-react if needed)

export default function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false) // New state for checkbox
  const [showPassword, setShowPassword] = useState(false) // New state for password visibility

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push(callbackUrl)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signIn('google', { callbackUrl })
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred during Google sign in')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left side - Updated Form */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center"> {/* Increased padding for better centering */}
        <div className="w-full max-w-md space-y-8"> {/* Increased space-y for more breathing room between sections */}
          {/* Brand/Logo Text like in image */}
          <div className="text-left text-primary font-semibold text-xl"> {/* Slightly larger for prominence */}
            Infinia {/* Customize this to your brand name */}
          </div>

          {/* Larger Heading and Subtext */}
          <div className="space-y-3"> {/* Added more space between heading and subtext */}
            <h2 className="text-5xl font-bold leading-tight">Hi, Welcome Back</h2> {/* Even larger to match image scale */}
            <p className="text-muted-foreground text-lg">You're just a few taps away.</p> {/* Increased size for better visibility */}
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-6"> {/* Increased space-y for inputs and button */}
            <Input
              type="email"
              placeholder="stanley@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 text-base rounded-lg"
            /> {/* Updated placeholder to match image */} {/* Added rounded corners for softer look */}

            {/* Password field with eye toggle */}
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 text-base rounded-lg pr-10" // Added pr-10 for icon space
              /> {/* Updated placeholder to match image */} {/* Added rounded corners */}
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
            </div> {/* Added mt-2 for slight gap after password */} {/* Add actual route if needed */}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-white"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button> {/* Ensured rounded and color match */}
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4"> {/* Added mt-4 for gap after button */}
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image (unchanged) */}
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