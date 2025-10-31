"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AuthSkeleton() {
  return (
    <div className="min-h-[100svh] md:min-h-screen w-full flex flex-col md:flex-row">
      {/* Left side - Form skeleton */}
      <div className="w-full md:w-1/2 px-4 py-6 sm:px-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-[420px] sm:max-w-md space-y-6 sm:space-y-8">
          {/* Brand/Logo */}
          <Skeleton className="h-6 w-24" />

          {/* Optional header label / context */}
          <Skeleton className="h-4 w-48 sm:w-36" />

          {/* Tenant hint row */}
          <Skeleton className="h-4 w-[80%] sm:w-64" />

          {/* Heading + subtext */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-8 w-56 sm:w-64" />
            <Skeleton className="h-5 w-40 sm:w-48" />
          </div>

          {/* Form fields */}
          <div className="space-y-5 sm:space-y-6">
            {/* Email */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Password with eye icon area */}
            <div className="relative">
              <Skeleton className="h-12 w-full rounded-lg" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Skeleton className="h-5 w-5 rounded-md" />
              </div>
            </div>

            {/* Remember + Forgot password */}
            <div className="flex items-center justify-between mt-1 sm:mt-2 gap-3">
              <Skeleton className="h-5 w-36 sm:w-40" />
              <Skeleton className="h-5 w-24 sm:w-28" />
            </div>

            {/* Error alert placeholder */}
            <Skeleton className="h-12 w-full rounded-md" />

            {/* Submit button */}
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-[1px] flex-1" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-[1px] flex-1" />
          </div>

          {/* Social auth row (placeholders) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md hidden sm:block" />
          </div>

          {/* Sign up / footer copy */}
          <Skeleton className="h-4 w-[85%] sm:w-64 mx-auto" />
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