"use client"

import { Suspense } from 'react'
import SignInContent from '@/app/signin/SignInContent'
import { AuthSkeleton } from '@/components/auth/AuthSkeleton'

export default function TenantSignInPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <SignInContent defaultCallback="/dashboard/tenant" signInSource="tenant" headerLabel="Tenant Sign In" />
    </Suspense>
  )
}