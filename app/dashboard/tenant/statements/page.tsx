'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/axios'
import { useUser } from '@/lib/context/user-context'
import { formatCurrency } from '@/lib/utils'
import { FileText, Receipt } from 'lucide-react'

export default function TenantStatementsPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [invoices, setInvoices] = useState<any[]>([])

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
        const invRes = await api.get('/payments/invoices/?page=1')
        const raw = invRes?.data?.results || []
        setInvoices(raw.filter((i: any) => i?.tenant?.user?.id === user.id).slice(0, 20))
      } catch (e) {
        console.error('Failed to load statements', e)
      }
    }
    load()
  }, [user, loading, router])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-6 shadow-theme-lg">
          <div>
            <div className="text-sm opacity-80">Billing</div>
            <div className="text-2xl font-bold">Statements & Bills</div>
          </div>
        </div>

        <Card className="shadow-theme">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              Your Statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-sm text-muted-foreground">No statements/bills.</div>
            ) : (
              <ul className="divide-y">
                {invoices.map((i: any) => (
                  <li key={i.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      {i.description || i.reference || `Invoice ${i.id}`}
                    </span>
                    <span className="text-muted-foreground">{new Date(i.created_at || i.date || Date.now()).toLocaleDateString()}</span>
                    <span className="sm:text-right font-medium">{formatCurrency(Number(i.amount || 0))}</span>
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