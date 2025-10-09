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
import { useExpenses, ExpenseFormula } from "@/hooks/useExpenses"
import { AddExpenseFormulaDialog } from "./add-expense-formula-dialog"

export function ExpenseFormulas({ propertyId }: { propertyId: string }) {
  const { formulas, loading, fetchFormulas, createFormula } = useExpenses(propertyId)

  useEffect(() => {
    fetchFormulas()
  }, [propertyId])

  const handleCreateFormula = async (data: any) => {
    await createFormula(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddExpenseFormulaDialog onSubmit={handleCreateFormula} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formulas.map((formula) => (
            <TableRow key={formula.id}>
              <TableCell>{formula.name}</TableCell>
              <TableCell>{formula.expense_type}</TableCell>
              <TableCell>{JSON.stringify(formula.formula)}</TableCell>
              <TableCell>{formula.is_active ? 'Active' : 'Inactive'}</TableCell>
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