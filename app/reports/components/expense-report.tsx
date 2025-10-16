"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Expense } from "@/hooks/useExpenses"

interface ExpenseReportProps {
  expenses: Expense[]
  loading: boolean
}

export function ExpenseReport({ expenses, loading }: ExpenseReportProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expense Report</CardTitle>
          <CardDescription>Detailed breakdown of all expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Date</th>
                  <th className="p-2 text-left font-medium">Name</th>
                  <th className="p-2 text-left font-medium">Type</th>
                  <th className="p-2 text-left font-medium">Amount</th>
                  <th className="p-2 text-left font-medium">Recurring</th>
                  <th className="p-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">Loading expenses...</p>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No expenses found</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b">
                      <td className="p-2">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="p-2">{expense.name}</td>
                      <td className="p-2">{expense.expense_type}</td>
                      <td className="p-2">{formatCurrency(expense.amount)}</td>
                      <td className="p-2">{expense.is_recurring ? "Yes" : "No"}</td>
                      <td className="p-2">{expense.description || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}