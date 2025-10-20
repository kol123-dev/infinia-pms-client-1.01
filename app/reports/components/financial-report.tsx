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
      // Compute tax amount from available fields
      const taxForItem =
        ((item.taxable_income ?? (item.revenue - item.expenses)) || 0) -
        ((item.net_profit ?? item.profit) || 0)
      acc.tax_amount += Math.max(0, taxForItem)
      return acc
    },
    { revenue: 0, expenses: 0, profit: 0, taxable_income: 0, net_profit: 0, tax_amount: 0 }
  )
  return (
    <div className="space-y-6">
      {/* top stats grid */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
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
        {/* New: Tax Amount */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Tax Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-amber-600">{formatCurrency(totals.tax_amount)}</div>
            <p className="text-xs text-muted-foreground">Taxable Income minus Net Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial data table FIRST */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Report Table</CardTitle>
          <CardDescription>Monthly breakdown of revenue, expenses, and profit</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-24 sm:pb-6">
          <div className="rounded-md border overflow-x-auto max-h-[60vh] overflow-y-auto pb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Month</th>
                  <th className="p-2 text-left font-medium">Revenue</th>
                  <th className="p-2 text-left font-medium">Expenses</th>
                  <th className="p-2 text-left font-medium">Taxable Income</th>
                  <th className="p-2 text-left font-medium">Net Profit</th>
                  <th className="p-2 text-left font-medium">Tax Amount</th>
                  <th className="p-2 text-left font-medium">Tax Rate</th>
                  <th className="p-2 text-left font-medium">Profit Margin</th>
                  <th className="p-2 text-left font-medium">Expense Ratio</th>
                  <th className="p-2 text-left font-medium">Revenue Growth</th>
                  <th className="p-2 text-left font-medium">Net Profit Growth</th>
                </tr>
              </thead>
              <tbody>
                {financialData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-4 text-center text-sm text-muted-foreground">
                      No data available
                    </td>
                  </tr>
                ) : (
                  financialData.map((item, idx) => {
                    const taxable = item.taxable_income ?? (item.revenue - item.expenses)
                    const net = item.net_profit ?? item.profit
                    const taxAmount = Math.max(0, taxable - net)
                    const taxRate = taxable > 0 ? (taxAmount / taxable) * 100 : 0
                    const profitMargin = item.revenue > 0 ? (net / item.revenue) * 100 : 0
                    const expenseRatio = item.revenue > 0 ? (item.expenses / item.revenue) * 100 : 0
                    const prev = financialData[idx - 1]
                    const prevRevenue = prev?.revenue ?? 0
                    const prevNet = (prev?.net_profit ?? prev?.profit) ?? 0
                    const revGrowth = idx > 0 && prevRevenue > 0 ? ((item.revenue - prevRevenue) / prevRevenue) * 100 : 0
                    const netGrowth = idx > 0 && prevNet > 0 ? ((net - prevNet) / prevNet) * 100 : 0

                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-2 text-sm">{item.month}</td>
                        <td className="p-2 text-sm">{formatCurrency(item.revenue)}</td>
                        <td className="p-2 text-sm">{formatCurrency(item.expenses)}</td>
                        <td className="p-2 text-sm">{formatCurrency(taxable)}</td>
                        <td className="p-2 text-sm">{formatCurrency(net)}</td>
                        <td className="p-2 text-sm">{formatCurrency(taxAmount)}</td>
                        <td className="p-2 text-sm">{`${taxRate.toFixed(2)}%`}</td>
                        <td className="p-2 text-sm">{`${profitMargin.toFixed(2)}%`}</td>
                        <td className="p-2 text-sm">{`${expenseRatio.toFixed(2)}%`}</td>
                        <td className="p-2 text-sm">{idx > 0 ? `${revGrowth.toFixed(2)}%` : "—"}</td>
                        <td className="p-2 text-sm">{idx > 0 ? `${netGrowth.toFixed(2)}%` : "—"}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chart AFTER the table */}
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