"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"

import { Loader2 } from "lucide-react" // Assuming you have lucide-react for a loading spinner

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full">
        {/* Shell skeleton: sidebar + header */}
        <div className="flex">
          {/* Sidebar skeleton (md+) */}
          <div className="hidden md:block w-64 border-r border-border bg-muted/5">
            <div className="p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>

          {/* Content area */}
          <div className="flex flex-col flex-1">
            {/* Header skeleton */}
            <div className="border-b border-border px-4 lg:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Skeleton className="h-8 w-40 sm:w-52 max-w-full" />
              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                <Skeleton className="h-9 w-full sm:w-56 max-w-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>

            {/* Page skeleton */}
            <main className="flex flex-1 w-full max-w-[100vw] overflow-x-hidden flex-col gap-4 p-4 min-h-[calc(100vh-60px)] lg:gap-6 lg:p-6">
              {pathname.startsWith("/dashboard") ? (
                <DashboardSkeleton />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // The useEffect will handle the redirect
  }

  return (
    <div className="min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col md:ml-64">
        <Header />
        <main className="flex flex-1 w-full max-w-[100vw] overflow-x-hidden flex-col gap-4 p-4 min-h-[calc(100vh-60px)] lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}