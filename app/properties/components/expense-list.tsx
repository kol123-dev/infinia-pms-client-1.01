"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useExpenses } from "@/hooks/useExpenses"
import { AddExpenseDialog } from "./add-expense-dialog"

export function ExpenseList({ propertyId }: { propertyId: string }) {
  const { expenses, formulas, loading, fetchExpenses, createExpense } = useExpenses(propertyId)

  useEffect(() => {
    fetchExpenses()
  }, [propertyId])

  const handleCreateExpense = async (data: any) => {
    await createExpense(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddExpenseDialog onSubmit={handleCreateExpense} formulas={formulas} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.date}</TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{expense.expense_type}</TableCell>
              <TableCell>KES {expense.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}