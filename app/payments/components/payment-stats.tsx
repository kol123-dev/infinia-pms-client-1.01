"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/axios"  // Changed from '@/lib/api' to '@/lib/axios'

interface PaymentStats {
  total_collected: {
    amount: number
    change_percentage: number
    color: 'green' | 'red'
  }
  pending_transactions: {
    amount: number
    count: number
  }
  overdue_payments: {
    amount: number
    count: number
  }
  success_rate: {
    rate: number
    change: number
    color: 'green' | 'red'
  }
}

export function PaymentStats() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/payments/payments/stats/')
        setStats(response.data)
      } catch (error) {
        console.error('Error fetching payment stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading || !stats) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.total_collected.amount)}</div>
          <p className={`text-xs ${stats.total_collected.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            {stats.total_collected.change_percentage > 0 ? '+' : ''}
            {stats.total_collected.change_percentage.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.pending_transactions.amount)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pending_transactions.count} transactions pending
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(stats.overdue_payments.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.overdue_payments.count} overdue payments
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.success_rate.rate.toFixed(1)}%</div>
          <p className={`text-xs ${stats.success_rate.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            {stats.success_rate.change > 0 ? '+' : ''}
            {stats.success_rate.change.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}