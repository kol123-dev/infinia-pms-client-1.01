"use client"

import { Suspense } from 'react'
import SignInContent from './SignInContent'

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
