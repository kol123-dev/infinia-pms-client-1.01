"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"
import { FinancialData, ChartConfig } from "../types"
import { formatCurrency } from "@/lib/utils"

interface FinancialReportProps {
  financialData: FinancialData[]
  chartConfig: ChartConfig
}

export function FinancialReport({ financialData, chartConfig }: FinancialReportProps) {
  const totals = financialData.reduce(
    (acc, item) => {
      acc.revenue += item.revenue || 0
      acc.expenses += item.expenses || 0
      acc.profit += item.profit || 0
      acc.taxable_income += (item.taxable_income ?? (item.revenue - item.expenses)) || 0
      acc.net_profit += (item.net_profit ?? item.profit) || 0
      return acc
    },
    { revenue: 0, expenses: 0, profit: 0, taxable_income: 0, net_profit: 0 }
  )
  return (
    <div className="space-y-6">
      {/* top stats grid */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(totals.revenue)}</div>
            <p className="text-xs text-muted-foreground">Summed across selected months</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</div>
            <p className="text-xs text-muted-foreground">Summed across selected months</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Taxable Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{formatCurrency(totals.taxable_income)}</div>
            <p className="text-xs text-muted-foreground">Revenue minus non-tax expenses</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-indigo-600">{formatCurrency(totals.net_profit)}</div>
            <p className="text-xs text-muted-foreground">Revenue minus all expenses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Performance</CardTitle>
          <CardDescription>Revenue, expenses, and profit over time</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-24 sm:pb-6">
          <ChartContainer config={chartConfig}>
            <BarChart data={financialData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" />
              <Bar dataKey="expenses" fill="var(--color-expenses)" />
              <Bar dataKey="profit" fill="var(--color-profit)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}