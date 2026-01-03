"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Expense } from "@/hooks/useExpenses"
import { useToast } from "@/hooks/use-toast"

const expenseTypes = [
  { value: "INFINIA_SYNC_FEE", label: "Infinia Sync Fee" },
  { value: "CARETAKER_SALARY", label: "Caretaker Salary" },
  { value: "GARBAGE_COLLECTION", label: "Garbage Collection" },
  { value: "KRA_TAX", label: "KRA Tax" },
  { value: "OTHER", label: "Other" }
]

const calculationTypes = [
  { value: "FIXED", label: "Fixed Amount" },
  { value: "PER_TENANT", label: "Per Active Tenant" },
  { value: "PERCENTAGE", label: "Percentage" }
]

type Props = {
  expense: Expense
  onSubmit: () => void
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  onOpenChange?: (open: boolean) => void
}

export function EditExpenseDialog({ expense, onSubmit, updateExpense, onOpenChange }: Props) {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const expenseTypes = [
    { value: "INFINIA_SYNC_FEE", label: "Infinia Sync Fee" },
    { value: "KRA_TAX", label: "KRA Tax" },
    { value: "OTHER", label: "Other" }
  ]

  const allowedExpenseValues = expenseTypes.map((t) => t.value)
  const initialExpenseType = allowedExpenseValues.includes(expense.expense_type)
    ? expense.expense_type
    : "OTHER"

  const [formData, setFormData] = useState<Partial<Expense>>({
    name: expense.name,
    expense_type: initialExpenseType,
    amount: expense.amount,
    date: expense.date.split("T")[0],
    description: expense.description,
    is_recurring: expense.is_recurring,
    calculation_type: expense.calculation_type,
    calculation_value: expense.calculation_value,
    // New optional fields
    recurrence_frequency: expense.recurrence_frequency || "MONTHLY",
    percentage_base: expense.percentage_base || "TOTAL_REVENUE",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateExpense(expense.id, formData)
      toast({
        title: "Success",
        description: "Expense updated successfully",
      })
      setOpen(false)
      onSubmit()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[640px] max-h-[85vh] p-0 overflow-hidden">
        <div className="flex flex-col max-h-[120vh]">
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
          </div>
          <form id="edit-expense-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.expense_type}
              onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
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

          <div className="flex items-center space-x-2">
            <Switch
              checked={!!formData.is_recurring}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  is_recurring: checked,
                  calculation_type: checked ? formData.calculation_type || "FIXED" : undefined,
                  calculation_value: checked ? formData.calculation_value || 0 : undefined,
                })
              }
            />
            <Label>Recurring Expense</Label>
          </div>

          {formData.is_recurring ? (
            <>
              <div className="space-y-2">
                <Label>Calculation Type</Label>
                <Select
                  value={formData.calculation_type}
                  onValueChange={(value) => setFormData({ ...formData, calculation_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Frequency */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={formData.recurrence_frequency}
                  onValueChange={(value) => setFormData({ ...formData, recurrence_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Value or Percentage */}
              <div className="space-y-2">
                <Label>
                  {formData.calculation_type === "FIXED" && "Fixed Amount (KES)"}
                  {formData.calculation_type === "PER_TENANT" && "Amount per Tenant (KES)"}
                  {formData.calculation_type === "PERCENTAGE" && "Percentage (%)"}
                </Label>
                <Input
                  type="number"
                  value={formData.calculation_value ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calculation_value: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
              {/* Base selector for percentage */}
              {formData.calculation_type === "PERCENTAGE" && (
                <div className="space-y-2">
                  <Label>Percentage Base</Label>
                  <Select
                    value={formData.percentage_base}
                    onValueChange={(value) => setFormData({ ...formData, percentage_base: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOTAL_REVENUE">Total Revenue</SelectItem>
                      <SelectItem value="TAXABLE_INCOME">Taxable Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input
                type="number"
                value={formData.amount ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value === "" ? 0 : parseFloat(e.target.value),
                  })
                }
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

        </form>
          <div className="sticky bottom-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t px-6 py-3">
            <Button form="edit-expense-form" type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}