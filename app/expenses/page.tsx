"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useExpenses } from "@/hooks/useExpenses"
import { formatCurrency } from "@/lib/utils"
import { ExpenseList } from "./components/expense-list"
import { Wallet } from "lucide-react"

export default function ExpensesPage() {
  const { expenses, loading, fetchExpenses, createExpense, deleteExpense, updateExpense } = useExpenses()
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Derived stats per property for recurring calculations
  const [occupiedCounts, setOccupiedCounts] = useState<Record<string, number>>({})
  const [monthlySummaries, setMonthlySummaries] = useState<Record<string, { monthly_revenue: number, net_profit: number, taxable_income: number, tax_total: number }>>({})
  const [propertyNames, setPropertyNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadDerivedStats = async () => {
      const propertyIds = Array.from(new Set(expenses.map(e => String(e.property || "")).filter(Boolean)))
      if (propertyIds.length === 0) return

      try {
        const counts: Record<string, number> = {}
        const summaries: Record<string, { monthly_revenue: number, net_profit: number, taxable_income: number, tax_total: number }> = {}
        const names: Record<string, string> = {}

        // Fetch occupied units count per property
        for (const pid of propertyIds) {
          try {
            const unitsRes = await (await import("@/lib/axios")).default.get(`/properties/${pid}/units/?status=OCCUPIED&page_size=9999`)
            const results = unitsRes.data?.results
            counts[pid] = Array.isArray(results) ? results.length : (Array.isArray(unitsRes.data) ? unitsRes.data.length : 0)
          } catch {
            counts[pid] = 0
          }
        }

        // Fetch monthly revenue/summary per property
        for (const pid of propertyIds) {
          try {
            const summaryRes = await (await import("@/lib/axios")).default.get(`/properties/expenses/monthly_summary/?property=${pid}`)
            const s = summaryRes.data || {}
            summaries[pid] = {
              monthly_revenue: Number(s.monthly_revenue || 0),
              net_profit: Number(s.net_profit || 0),
              taxable_income: Number(s.taxable_income || 0),
              tax_total: Number(s.tax_total || 0),
            }
          } catch {
            summaries[pid] = { monthly_revenue: 0, net_profit: 0, taxable_income: 0, tax_total: 0 }
          }
        }

        // Fetch property names for display
        for (const pid of propertyIds) {
          try {
            const propRes = await (await import("@/lib/axios")).default.get(`/properties/${pid}/`)
            names[pid] = String(propRes.data?.name || "")
          } catch {
            names[pid] = ""
          }
        }

        setOccupiedCounts(counts)
        setMonthlySummaries(summaries)
        setPropertyNames(names)
      } catch (err) {
        console.error("Error loading derived stats:", err)
      }
    }
    loadDerivedStats()
  }, [expenses])

  const totalExpenses = expenses.reduce((sum, e) => {
    const fromApi = (e as any).monthly_amount
    if (typeof fromApi === "number" && Number.isFinite(fromApi)) {
      return sum + fromApi
    }
    // Non-recurring just uses amount
    const safeNumber = (v: any) => {
      const num = typeof v === "string" ? parseFloat(v) : Number(v)
      return isNaN(num) ? 0 : num
    }

    if (!e.is_recurring) {
      return sum + safeNumber(e.amount ?? 0)
    }

    const freq = String(e.recurrence_frequency || "MONTHLY").toUpperCase()
    const freqMultiplier = freq === "WEEKLY" ? (52 / 12) : 1

    const calcType = String(e.calculation_type || "").toUpperCase()
    if (calcType === "FIXED") {
      return sum + safeNumber(e.calculation_value ?? 0) * freqMultiplier
    }
    if (calcType === "PER_TENANT") {
      const pid = String(e.property || "")
      const activeTenants = occupiedCounts[pid] || 0
      const perTenant = safeNumber(e.calculation_value ?? 0)
      return sum + (perTenant * activeTenants * freqMultiplier)
    }
    if (calcType === "PERCENTAGE") {
      const percentage = safeNumber(e.calculation_value ?? 0) / 100
      const pid = String(e.property || "")
      const base = String(e.percentage_base || "TOTAL_REVENUE").toUpperCase()
      const summary = monthlySummaries[pid] || { monthly_revenue: 0, net_profit: 0, taxable_income: 0, tax_total: 0 }
      const baseAmount = base === "TAXABLE_INCOME" ? summary.taxable_income : summary.monthly_revenue
      return sum + (safeNumber(baseAmount) * percentage * freqMultiplier)
    }

    // Fallback
    const raw = e.calculation_value ?? e.amount ?? 0
    return sum + safeNumber(raw)
  }, 0)

  return (
    <MainLayout>
      <div className="space-y-6 p-4 sm:p-6 w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Expenses</h1>
        
        <Card className="shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</span>
              <div className="text-4xl font-extrabold tracking-tight text-blue-950">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <ExpenseList
          expenses={expenses}
          loading={loading}
          fetchExpenses={fetchExpenses}
          createExpense={createExpense}
          deleteExpense={deleteExpense}
          updateExpense={updateExpense}
          occupiedCounts={occupiedCounts}
          monthlySummaries={monthlySummaries}
          propertyNames={propertyNames}
        />
      </div>
    </MainLayout>
  )
}