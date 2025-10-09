"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ExpenseFormula } from "@/hooks/useExpenses"

const expenseTypes = [
  { value: 'INFINIA_SYNC_FEE', label: 'Infinia Sync Fee' },
  { value: 'CARETAKER_SALARY', label: 'Caretaker Salary' },
  { value: 'GARBAGE_COLLECTION', label: 'Garbage Collection' },
  { value: 'TAX', label: 'KRA Tax' },
  { value: 'OTHER', label: 'Other' },
]

export function AddExpenseDialog({ 
  onSubmit, 
  formulas 
}: { 
  onSubmit: (data: any) => void
  formulas: ExpenseFormula[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    expense_type: "",
    expense_formula: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      })
      setOpen(false)
      setFormData({
        expense_type: "",
        expense_formula: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
      })
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record expense",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Record Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.expense_type}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                expense_type: value,
                expense_formula: "" // Reset formula when type changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formulas.length > 0 && (
            <div className="space-y-2">
              <Label>Formula (Optional)</Label>
              <Select
                value={formData.expense_formula}
                onValueChange={(value) => setFormData({ ...formData, expense_formula: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a formula" />
                </SelectTrigger>
                <SelectContent>
                  {formulas
                    .filter(f => f.expense_type === formData.expense_type)
                    .map((formula) => (
                      <SelectItem key={formula.id} value={formula.id}>
                        {formula.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Amount (KES)</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Recording..." : "Save Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}