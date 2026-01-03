"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { AddExpenseDialog } from "./add-expense-dialog"
import { Button } from "@/components/ui/button"
import { EditExpenseDialog } from "./edit-expense-dialog"
import { Expense } from "@/hooks/useExpenses"
import { Pencil, Trash2, Plus } from "lucide-react"

type Props = {
  expenses: Expense[]
  loading: boolean
  fetchExpenses: () => void
  createExpense: (data: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  occupiedCounts: Record<string, number>
  monthlySummaries: Record<string, { monthly_revenue: number; net_profit: number; taxable_income: number; tax_total: number }>
  propertyNames: Record<string, string>
}

export function ExpenseList({
  expenses,
  loading,
  fetchExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  occupiedCounts,
  monthlySummaries,
  propertyNames,
}: Props) {
  const [editing, setEditing] = useState<Expense | null>(null)

  const computeDisplayAmount = (e: Expense) => {
    // Prefer backend-computed monthly_amount when available
    const apiAmount = (e as any).monthly_amount
    if (typeof apiAmount === "number" && Number.isFinite(apiAmount)) {
      return apiAmount
    }

    const safeNumber = (v: any) => {
      const num = typeof v === "string" ? parseFloat(v) : Number(v)
      return isNaN(num) ? 0 : num
    }
    const pid = String(e.property || "")

    // Use each row's configuration for KRA_TAX instead of aggregated tax_total
    if (String(e.expense_type || "").toUpperCase() === "KRA_TAX") {
      if (!e.is_recurring) return safeNumber(e.amount ?? 0)

      const freq = String(e.recurrence_frequency || "MONTHLY").toUpperCase()
      const fm = freq === "WEEKLY" ? (52 / 12) : 1
      const calcType = String(e.calculation_type || "").toUpperCase()

      if (calcType === "FIXED") {
        return safeNumber(e.calculation_value ?? e.amount) * fm
      }
      if (calcType === "PER_TENANT") {
        const activeTenants = occupiedCounts[pid] || 0
        return safeNumber(e.calculation_value ?? 0) * activeTenants * fm
      }
      if (calcType === "PERCENTAGE") {
        const rate = safeNumber(e.calculation_value ?? 0) / 100
        const base = String(e.percentage_base || "TOTAL_REVENUE").toUpperCase()
        const s = monthlySummaries[pid] || { monthly_revenue: 0, taxable_income: 0 }
        const baseAmount = base === "TAXABLE_INCOME" ? s.taxable_income : s.monthly_revenue
        return safeNumber(baseAmount) * rate * fm
      }
      const raw = e.calculation_value ?? e.amount ?? 0
      return safeNumber(raw)
    }

    // Non-tax expenses
    if (!e.is_recurring) return safeNumber(e.amount ?? 0)

    const freq = String(e.recurrence_frequency || "MONTHLY").toUpperCase()
    const freqMultiplier = freq === "WEEKLY" ? (52 / 12) : 1
    const calcType = String(e.calculation_type || "").toUpperCase()

    if (!e.is_recurring) return safeNumber(e.amount ?? 0)
    if (calcType === "FIXED") {
      return safeNumber(e.calculation_value ?? 0) * freqMultiplier
    }
    if (calcType === "PER_TENANT") {
      const activeTenants = occupiedCounts[pid] || 0
      const perTenant = safeNumber(e.calculation_value ?? 0)
      return perTenant * activeTenants * freqMultiplier
    }
    if (calcType === "PERCENTAGE") {
      const percentage = safeNumber(e.calculation_value ?? 0) / 100
      const base = String(e.percentage_base || "TOTAL_REVENUE").toUpperCase()
      const summary = monthlySummaries[pid] || { monthly_revenue: 0, taxable_income: 0 }
      const baseAmount = base === "TAXABLE_INCOME" ? summary.taxable_income : summary.monthly_revenue
      return safeNumber(baseAmount) * percentage * freqMultiplier
    }
    const raw = e.calculation_value ?? e.amount ?? 0
    return safeNumber(raw)
  }

  return (
    <div className="relative pb-24 w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No expenses found</div>
        ) : (
          expenses.map((expense) => {
            // Determine border color based on expense type/attributes
            const colorDotClass = expense.is_recurring 
              ? "bg-blue-500" 
              : expense.amount > 10000 
                ? "bg-red-500" 
                : "bg-green-500"

            return (
              <div 
                key={expense.id} 
                className="rounded-lg shadow-sm bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1 min-w-0 pr-3 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-block h-2 w-2 rounded-full ${colorDotClass}`}></span>
                  <span className="font-medium truncate text-sm text-foreground">
                    {expense.description || expense.name || "Untitled Expense"}
                  </span>
                </div>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0">{new Date(expense.date).toLocaleDateString()}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-semibold text-foreground shrink-0">
                      {formatCurrency(computeDisplayAmount(expense))}
                    </span>
                    {expense.is_recurring && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                        Recurring
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50" 
                    onClick={() => setEditing(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      await deleteExpense(expense.id)
                      fetchExpenses()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <AddExpenseDialog 
          onSubmit={fetchExpenses} 
          createExpenseOverride={createExpense}
          trigger={
            <Button className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 p-0 flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </Button>
          }
        />
      </div>

      {editing && (
        <EditExpenseDialog
          expense={editing}
          onSubmit={() => {
            setEditing(null)
            fetchExpenses()
          }}
          updateExpense={updateExpense}
          onOpenChange={(open: boolean) => {
            if (!open) setEditing(null)
          }}
        />
      )}
    </div>
  )
}