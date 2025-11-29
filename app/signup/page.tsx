"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUp() {
  const router = useRouter()
  const { signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'landlord' | 'tenant' | 'property_manager' | 'maintenance_staff'>('tenant')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('Email sign-up is currently unavailable. Please use Google or contact your agent/landlord to be invited.')
  }

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
      router.push('/profile')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred during Google sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">Choose your signup method and role</p>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
            <Select
              value={role}
              onValueChange={(value: any) => setRole(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landlord">Property Owner/Landlord</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="property_manager">Property Manager</SelectItem>
                <SelectItem value="maintenance_staff">Maintenance Staff</SelectItem>
              </SelectContent>
            </Select>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:block w-1/2 bg-black relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/auth-background.jpg"
            alt="Authentication background"
            fill
            sizes="(min-width: 768px) 50vw, 0vw"
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