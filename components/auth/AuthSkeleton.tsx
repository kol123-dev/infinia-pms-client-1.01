"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AuthSkeleton() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left side - Form skeleton */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          {/* Brand/Logo */}
          <Skeleton className="h-6 w-24" />

          {/* Optional header label */}
          <Skeleton className="h-4 w-36" />

          {/* Tenant hint row */}
          <Skeleton className="h-4 w-64" />

          {/* Heading + subtext */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Form fields */}
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Remember + Forgot password */}
            <div className="flex items-center justify-between mt-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-28" />
            </div>

            {/* Error alert placeholder */}
            <Skeleton className="h-12 w-full rounded-md" />

            {/* Submit button */}
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          {/* Sign up link */}
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>

      {/* Right side - Image skeleton */}
      <div className="hidden md:block w-1/2 bg-black relative overflow-hidden">
        <div className="absolute inset-0 p-8">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}