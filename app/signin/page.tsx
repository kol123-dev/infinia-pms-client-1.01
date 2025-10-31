"use client"

import { Suspense } from 'react'
import SignInContent from './SignInContent'
import { AuthSkeleton } from '@/components/auth/AuthSkeleton'

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <SignInContent />
    </Suspense>
  )
}
