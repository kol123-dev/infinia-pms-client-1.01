"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useExpenses } from "@/hooks/useExpenses"
import { formatCurrency } from "@/lib/utils"
import { ExpenseList } from "./components/expense-list"

export default function ExpensesPage() {
  const { expenses, loading, fetchExpenses, createExpense, deleteExpense, updateExpense } = useExpenses()
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Derived stats per property for recurring calculations
  const [occupiedCounts, setOccupiedCounts] = useState<Record<string, number>>({})
  const [monthlySummaries, setMonthlySummaries] = useState<Record<string, { monthly_revenue: number, net_profit: number, taxable_income: number }>>({})
  const [propertyNames, setPropertyNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadDerivedStats = async () => {
      const propertyIds = Array.from(new Set(expenses.map(e => String(e.property || "")).filter(Boolean)))
      if (propertyIds.length === 0) return

      try {
        const counts: Record<string, number> = {}
        const summaries: Record<string, { monthly_revenue: number, net_profit: number, taxable_income: number }> = {}
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
            }
          } catch {
            summaries[pid] = { monthly_revenue: 0, net_profit: 0, taxable_income: 0 }
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
      const summary = monthlySummaries[pid] || { monthly_revenue: 0, net_profit: 0, taxable_income: 0 }
      const baseAmount = base === "TAXABLE_INCOME" ? summary.taxable_income : summary.monthly_revenue
      return sum + (safeNumber(baseAmount) * percentage * freqMultiplier)
    }

    // Fallback
    const raw = e.calculation_value ?? e.amount ?? 0
    return sum + safeNumber(raw)
  }, 0)

  return (
    <MainLayout>
      <div className="space-y-4 p-8">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
        </div>
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