'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/axios'
import { useUser } from '@/lib/context/user-context'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, CreditCard, FileText, Bell, Receipt } from 'lucide-react'

export default function TenantDashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [tenant, setTenant] = useState<any | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
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
        const tRes = await api.get('/tenants/?page=1')
        const list = tRes.data?.results || []
        const mine = list.find((t: any) => t?.user?.id === user.id) || null
        setTenant(mine)

        // Optional: your backend may have a direct invoices endpoint filtered by tenant
        try {
          const invRes = await api.get('/payments/invoices/?page=1')
          const raw = invRes?.data?.results || []
          setInvoices(
            raw.filter((i: any) => i?.tenant?.user?.id === user.id).slice(0, 5)
          )
        } catch {}

        // Optional: recent messages (best effort)
        try {
          const smsRes = await api.get('/communications/messages/?page=1')
          const raw = smsRes?.data?.results || []
          setMessages(
            raw
              .filter((m: any) =>
                (m.recipients || []).some((r: any) => r?.user?.id === user.id)
              )
              .slice(0, 5)
          )
        } catch {}
      } catch (e) {
        console.error('Failed to load tenant dashboard', e)
      }
    }

    load()
  }, [user, loading, router])

  const balanceDue = useMemo(() => {
    return tenant?.balance_due ? Number(tenant.balance_due) : 0
  }, [tenant])

  const unit = tenant?.current_unit

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero with payments CTA */}
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-6 shadow-theme-lg">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="text-sm opacity-80">Welcome</div>
              <div className="text-2xl font-bold">Tenant Dashboard</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/payments" className="inline-block">
                <Button variant="secondary" size="sm">Pay Now</Button>
              </Link>
              <Link href="/payments" className="inline-block">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Payment History
                </Button>
              </Link>
              <Link href="/dashboard/tenant/statements" className="inline-block">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  View Statements
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick overview cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-4 w-4 text-brand-600" />
                Current Unit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property</span>
                  <span>{unit?.property?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit</span>
                  <span>{unit?.unit_number || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{unit?.unit_status || 'N/A'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-600" />
                Balance Due
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(balanceDue)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/payments">
                  <Button size="sm">Pay Now</Button>
                </Link>
                <Link href="/payments">
                  <Button size="sm" variant="outline">Payment History</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Next Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Check your upcoming bills and statements.
              </div>
              <div className="mt-3">
                <Link href="/dashboard/tenant/statements">
                  <Button size="sm" variant="outline">View Statements</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent invoices */}
          <Card className="shadow-theme md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices found.</div>
              ) : (
                <ul className="divide-y">
                  {invoices.map((i: any) => (
                    <li key={i.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span>{i.description || i.reference || `Invoice ${i.id}`}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(Number(i.amount || 0))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-600" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">No messages.</div>
              ) : (
                <ul className="divide-y">
                  {messages.map((m: any) => (
                    <li key={m.id} className="py-2 text-sm">
                      {m.body?.slice(0, 80) || 'Message'}{m.body?.length > 80 ? '...' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}