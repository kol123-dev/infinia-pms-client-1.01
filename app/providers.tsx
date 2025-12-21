'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useOnlineStatus } from '../hooks/use-online-status'
import { flushSyncQueue } from '../lib/offline/sync'
import { countSyncQueue } from '../lib/offline/db'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const { isOnline } = useOnlineStatus()
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((rs) => {
        if (rs.length) rs.forEach((r) => r.unregister())
      })
    }
  }, [])

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = String(e.message || '')
      if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk')) {
        if (typeof window !== 'undefined') window.location.reload()
      }
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e.reason
      const name = String(reason?.name || '')
      const msg = String(reason?.message || reason || '')
      if (name === 'ChunkLoadError' || msg.includes('Loading chunk')) {
        if (typeof window !== 'undefined') window.location.reload()
      }
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      void flushSyncQueue().catch(() => {})
    }
  }, [isOnline])
  useEffect(() => {
    let t: any
    const tick = async () => {
      const n = await countSyncQueue().catch(() => 0)
      setQueueCount(n)
    }
    void tick()
    t = setInterval(tick, 5000)
    return () => {
      if (t) clearInterval(t)
    }
  }, [])

  // Cross-tab logout sync: storage + BroadcastChannel
  useEffect(() => {
    let bc: BroadcastChannel | null = null

    const handleLogoutSignal = async () => {
      console.log('[Providers] Received logout signal. Signing out...')
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
        {!isOnline && (
          <div className="sticky top-0 z-50 w-full bg-amber-500 px-3 py-2 text-center text-sm font-medium text-black">
            You’re offline. Changes will sync automatically when you’re back online{queueCount ? ` • Queued changes: ${queueCount}` : ''}.
          </div>
        )}
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
