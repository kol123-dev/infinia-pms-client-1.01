"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useExpenses, Expense } from "@/hooks/useExpenses"
import api from "@/lib/axios"

// Restore missing local types/constants
interface Property {
  id: number
  name: string
}

interface AddExpenseDialogProps {
  onSubmit: () => void
  createExpenseOverride?: (data: Partial<Expense>) => Promise<void>
}

// Backend-supported expense types only
const expenseTypes = [
  { value: "INFINIA_SYNC_FEE", label: "Infinia Sync Fee" },
  { value: "KRA_TAX", label: "KRA Tax" },
  { value: "OTHER", label: "Other" }
]

const calculationTypes = [
  { value: "FIXED", label: "Fixed Amount" },
  { value: "PER_TENANT", label: "Per Active Tenant" },
  { value: "PERCENTAGE", label: "Percentage" }
]

export function AddExpenseDialog({ onSubmit, createExpenseOverride }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const { createExpense } = useExpenses()
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<Expense>>({
    name: "",
    expense_type: "OTHER", // default to valid backend type
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    is_recurring: false,
    calculation_type: "FIXED",
    calculation_value: 0,
    property: "",
    // New optional fields
    recurrence_frequency: "MONTHLY",
    percentage_base: "TOTAL_REVENUE",
  })

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties/')
        setProperties(response.data.results || [])
      } catch (error) {
        console.error("Error fetching properties:", error)
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        })
      }
    }
    
    if (open) {
      fetchProperties()
    }
  }, [open, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Guard: ensure valid expense_type
    const allowed = new Set(expenseTypes.map(t => t.value))
    const payload = {
      ...formData,
      expense_type: allowed.has(formData.expense_type as string) ? formData.expense_type : "OTHER",
    }

    try {
      if (createExpenseOverride) {
        await createExpenseOverride(payload)
      } else {
        await createExpense(payload)
      }
      toast({
        title: "Success",
        description: "Expense created successfully",
      })
      setOpen(false)
      onSubmit()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select
              value={formData.property}
              onValueChange={(value) => setFormData({ ...formData, property: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                is_recurring: checked,
                calculation_type: checked ? "FIXED" : undefined,
                calculation_value: checked ? 0 : undefined
              })}
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
              {/* Frequency for recurring */}
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
                  value={formData.calculation_value || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    calculation_value: e.target.value === "" ? 0 : parseFloat(e.target.value)
                  })}
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
                value={formData.amount || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  amount: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                })}
                required
              />
            </div>
          )}

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
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Save Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}