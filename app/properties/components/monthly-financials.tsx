"use client"

import { useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useExpenses } from "@/hooks/useExpenses"

export function MonthlyFinancials({ propertyId }: { propertyId: string }) {
  const { financials, loading, fetchMonthlyFinancials } = useExpenses(propertyId)

  useEffect(() => {
    fetchMonthlyFinancials()
  }, [propertyId])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Total monthly revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            KES {financials?.monthly_revenue.toLocaleString() ?? 0}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Total monthly expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            KES {financials?.total_expenses.toLocaleString() ?? 0}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Net Profit</CardTitle>
          <CardDescription>Monthly net profit</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            KES {financials?.net_profit.toLocaleString() ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}