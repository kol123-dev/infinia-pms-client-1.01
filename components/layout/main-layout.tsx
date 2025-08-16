"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

import { Loader2 } from "lucide-react" // Assuming you have lucide-react for a loading spinner

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
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
        <main className="flex flex-1 flex-col gap-4 p-4 min-h-[calc(100vh-60px)] lg:gap-6 lg:p-6">{children}</main>
      </div>
    </div>
  )
}