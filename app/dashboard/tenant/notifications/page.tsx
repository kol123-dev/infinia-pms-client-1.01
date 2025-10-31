'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/axios'
import { useUser } from '@/lib/context/user-context'
import { Bell } from 'lucide-react'

export default function TenantNotificationsPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/signin')
      return
    }
    if (user.role !== 'tenant') {
      router.replace('/dashboard')
      return
    }
    const load = async () => {
      try {
        const smsRes = await api.get('/communications/messages/?page=1')
        const raw = smsRes?.data?.results || []
        setMessages(
          raw
            .filter((m: any) =>
              (m.recipients || []).some((r: any) => r?.user?.id === user.id)
            )
            .slice(0, 20)
        )
      } catch (e) {
        console.error('Failed to load notifications', e)
      }
    }
    load()
  }, [user, loading, router])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-6 shadow-theme-lg">
          <div>
            <div className="text-sm opacity-80">Inbox</div>
            <div className="text-2xl font-bold">Notifications & Alerts</div>
          </div>
        </div>

        <Card className="shadow-theme">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-600" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">No notifications.</div>
            ) : (
              <ul className="divide-y">
                {messages.map((m: any) => (
                  <li key={m.id} className="py-3 flex items-start gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm">{m.body || 'Message'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(m.created_at || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}