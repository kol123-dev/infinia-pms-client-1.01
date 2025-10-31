'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'
import { useUser } from '@/lib/context/user-context'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Wallet, FileText, Receipt } from 'lucide-react'

export default function TenantPaymentsPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [tenant, setTenant] = useState<any | null>(null)
  const [payments, setPayments] = useState<any[]>([])

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

        const invRes = await api.get('/payments/invoices/?page=1')
        const raw = invRes?.data?.results || []
        setPayments(raw.filter((i: any) => i?.tenant?.user?.id === user.id).slice(0, 10))
      } catch (e) {
        console.error('Failed to load payments', e)
      }
    }
    load()
  }, [user, loading, router])

  const balanceDue = useMemo(() => Number(tenant?.balance_due || 0), [tenant])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-6 shadow-theme-lg">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="text-sm opacity-80">Payments</div>
              <div className="text-2xl font-bold">Balance & Payments</div>
            </div>
            <div className="flex gap-2">
              <Link href="/payments">
                <Button variant="secondary">Pay Now</Button>
              </Link>
              <Link href="/payments">
                <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">Payment History</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-600" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(balanceDue)}</div>
              <div className="text-sm text-muted-foreground mt-1">Contact management if this looks incorrect.</div>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices found.</div>
              ) : (
                <ul className="divide-y">
                  {payments.map((i: any) => (
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
        </div>
      </div>
    </MainLayout>
  )
}