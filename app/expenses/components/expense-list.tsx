"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddExpenseDialog } from "./add-expense-dialog"
import { Button } from "@/components/ui/button"
import { EditExpenseDialog } from "./edit-expense-dialog"
import { Expense } from "@/hooks/useExpenses"

type Props = {
  expenses: Expense[]
  loading: boolean
  fetchExpenses: () => void
  createExpense: (data: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  occupiedCounts: Record<string, number>
  monthlySummaries: Record<string, { monthly_revenue: number; net_profit: number; taxable_income: number }>
  propertyNames: Record<string, string>
}

export function ExpenseList({ expenses, loading, fetchExpenses, createExpense, deleteExpense, updateExpense, occupiedCounts, monthlySummaries, propertyNames }: Props) {
  const [editing, setEditing] = useState<Expense | null>(null)

  const computeDisplayAmount = (e: Expense) => {
    const safeNumber = (v: any) => {
      const num = typeof v === "string" ? parseFloat(v) : Number(v)
      return isNaN(num) ? 0 : num
    }
    if (!e.is_recurring) return safeNumber(e.amount ?? 0)

    const freq = String(e.recurrence_frequency || "MONTHLY").toUpperCase()
    const freqMultiplier = freq === "WEEKLY" ? (52 / 12) : 1
    const calcType = String(e.calculation_type || "").toUpperCase()

    if (calcType === "FIXED") {
      return safeNumber(e.calculation_value ?? 0) * freqMultiplier
    }
    if (calcType === "PER_TENANT") {
      const pid = String(e.property || "")
      const activeTenants = occupiedCounts[pid] || 0
      const perTenant = safeNumber(e.calculation_value ?? 0)
      return perTenant * activeTenants * freqMultiplier
    }
    if (calcType === "PERCENTAGE") {
      const percentage = safeNumber(e.calculation_value ?? 0) / 100
      const pid = String(e.property || "")
      const base = String(e.percentage_base || "TOTAL_REVENUE").toUpperCase()
      const summary = monthlySummaries[pid] || { monthly_revenue: 0, net_profit: 0, taxable_income: 0 }
      const baseAmount = base === "TAXABLE_INCOME" ? summary.taxable_income : summary.monthly_revenue
      return safeNumber(baseAmount) * percentage * freqMultiplier
    }
    const raw = e.calculation_value ?? e.amount ?? 0
    return safeNumber(raw)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expenses</CardTitle>
        <AddExpenseDialog onSubmit={fetchExpenses} createExpenseOverride={createExpense} />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">Loading expenses...</p>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No expenses found</p>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.name}</TableCell>
                    <TableCell>{expense.expense_type}</TableCell>
                    <TableCell>{propertyNames[String(expense.property || "")] || "-"}</TableCell>
                    <TableCell>{formatCurrency(computeDisplayAmount(expense))}</TableCell>
                    <TableCell>
                      <Badge variant={expense.is_recurring ? "default" : "secondary"}>
                        {expense.is_recurring ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description || "-"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(expense)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await deleteExpense(expense.id)
                          fetchExpenses()
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

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
    </Card>
  )
}