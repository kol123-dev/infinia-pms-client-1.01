import type React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
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