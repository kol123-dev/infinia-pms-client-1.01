"use client"

import { Suspense } from 'react'
import SignInContent from '@/app/signin/SignInContent'

export default function TenantSignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent defaultCallback="/dashboard/tenant" signInSource="tenant" headerLabel="Tenant Sign In" />
    </Suspense>
  )
}