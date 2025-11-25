'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((rs) => {
        if (rs.length) rs.forEach((r) => r.unregister())
      })
    }
  }, [])

  // Cross-tab logout sync: storage + BroadcastChannel
  useEffect(() => {
    let bc: BroadcastChannel | null = null

    const handleLogoutSignal = async () => {
      try {
        await signOut({ redirect: false })
        window.location.href = '/signin'
      } catch {
        // no-op
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'logout' && e.newValue) {
        handleLogoutSignal()
      }
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('auth')
      bc.onmessage = (msg) => {
        if (msg?.data?.type === 'logout') {
          handleLogoutSignal()
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      if (bc) bc.close()
    }
  }, [])

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}