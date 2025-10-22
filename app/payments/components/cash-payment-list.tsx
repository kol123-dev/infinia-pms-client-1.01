"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/axios"

interface CashPayment {
  id: number
  receipt_number: string
  amount: number
  notes?: string | null
  tenant_name?: string | null
  property_name?: string | null
  unit_number?: string | null
  paid_date?: string | null
  payment_status?: string | null
  payment_id?: string | null
  received_by?: { full_name?: string | null } | null
}

export function CashPaymentList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState<CashPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCashPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        const resp = await api.get('/payments/cash/', {
          params: { page: 1, page_size: 10 }
        })
        const data = resp.data
        const results: CashPayment[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : [])
        setPayments(results)
      } catch (err) {
        console.error('Error fetching cash payments:', err)
        setError('Failed to load cash payments. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchCashPayments()
  }, [])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return payments
    return payments.filter(p => {
      const fields = [
        p.receipt_number,
        p.tenant_name,
        p.property_name,
        p.unit_number,
        p.payment_id
      ]
      return fields.some(f => (f || '').toString().toLowerCase().includes(q))
    })
  }, [payments, searchTerm])

  if (loading) {
    return (
      <div className="py-6 text-muted-foreground">Loading cash payments...</div>
    )
  }

  if (error) {
    return (
      <div className="py-6 text-destructive">{error}</div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search payments..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Receipt #</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-bold">{payment.receipt_number || 'N/A'}</TableCell>
              <TableCell>{payment.tenant_name || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{payment.property_name || 'N/A'}</span>
                  <span className="text-sm text-green-600">Unit {payment.unit_number || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="font-bold">{formatCurrency(payment.amount || 0)}</TableCell>
              <TableCell>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={(payment.payment_status || '').toLowerCase() === 'paid' ? 'default' : 'secondary'}>
                  {payment.payment_status || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>{payment.received_by?.full_name || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}