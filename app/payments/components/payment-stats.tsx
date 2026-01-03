"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/axios"
import { DollarSign, Clock, AlertTriangle, TrendingUp } from "lucide-react"

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
        const response = await api.get('/payments/payments/stats/')  // Updated path to match backend routing
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
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 p-2 sm:p-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Collected</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            KES {formatCurrency(stats.total_collected.amount)}
          </div>
          <p className={`text-xs ${stats.total_collected.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            {stats.total_collected.change_percentage > 0 ? '+' : ''}
            {stats.total_collected.change_percentage.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.pending_transactions.amount)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pending_transactions.count} transactions pending
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-xs sm:text-sm font-medium">Overdue</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg sm:text-2xl font-bold text-red-600">
            {formatCurrency(stats.overdue_payments.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.overdue_payments.count} overdue payments
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <CardTitle className="text-xs sm:text-sm font-medium">Success Rate</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-lg sm:text-2xl font-bold ${stats.success_rate.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            {stats.success_rate.rate.toFixed(1)}%
          </div>
          <p className={`text-xs ${stats.success_rate.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            {stats.success_rate.change > 0 ? '+' : ''}
            {stats.success_rate.change.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}