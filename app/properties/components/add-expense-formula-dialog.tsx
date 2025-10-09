"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

const expenseTypes = [
  { value: 'INFINIA_SYNC_FEE', label: 'Infinia Sync Fee' },
  { value: 'CARETAKER_SALARY', label: 'Caretaker Salary' },
  { value: 'GARBAGE_COLLECTION', label: 'Garbage Collection' },
  { value: 'TAX', label: 'KRA Tax' },
  { value: 'OTHER', label: 'Other' },
] as const

type Formula = {
  per_tenant_fee?: number;
  fixed_amount?: number;
  tax_rate?: number;
}

type FormData = {
  name: string;
  expense_type: string;
  formula: Formula;
}

export function AddExpenseFormulaDialog({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    expense_type: "",
    formula: {}
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      setOpen(false)
      setFormData({ name: "", expense_type: "", formula: {} })
      toast({
        title: "Success",
        description: "Expense formula created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create expense formula",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Formula</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense Formula</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.expense_type}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                expense_type: value,
                formula: {} 
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

          {formData.expense_type === "INFINIA_SYNC_FEE" && (
            <div className="space-y-2">
              <Label>Per Tenant Fee (KES)</Label>
              <Input
                type="number"
                value={formData.formula.per_tenant_fee || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  formula: { per_tenant_fee: parseFloat(e.target.value) }
                })}
                required
              />
            </div>
          )}

          {["CARETAKER_SALARY", "GARBAGE_COLLECTION"].includes(formData.expense_type) && (
            <div className="space-y-2">
              <Label>Fixed Amount (KES)</Label>
              <Input
                type="number"
                value={formData.formula.fixed_amount || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  formula: { fixed_amount: parseFloat(e.target.value) }
                })}
                required
              />
            </div>
          )}

          {formData.expense_type === "TAX" && (
            <div className="space-y-2">
              <Label>Tax Rate (0-1)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.formula.tax_rate || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  formula: { tax_rate: parseFloat(e.target.value) }
                })}
                required
              />
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Save Formula"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}