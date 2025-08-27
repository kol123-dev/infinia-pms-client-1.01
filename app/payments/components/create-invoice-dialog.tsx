"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import axios from "@/lib/axios"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CreateInvoiceDialogProps {
  children: React.ReactNode
}

interface Tenant {
  id: number
  user: {
    full_name: string
  }
  current_unit: {
    id: number
    unit_number: string
  }
}

export function CreateInvoiceDialog({ children }: CreateInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    tenant: "",
    amount: "",
    dueDate: "",
    description: "",
  })

  const { data: tenants } = useQuery<{ results: Tenant[] }>({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await axios.get("/tenants/")
      return response.data
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedTenant = tenants?.results.find(t => t.id.toString() === formData.tenant)
      
      if (!selectedTenant) {
        throw new Error("Please select a tenant")
      }

      const payload = {
        tenant: parseInt(formData.tenant),
        unit: selectedTenant.current_unit.id,
        due_date: new Date(formData.dueDate).toISOString(),
        amount: parseFloat(formData.amount),
        status: "SENT",
        items: [
          {
            description: formData.description,
            amount: parseFloat(formData.amount),
            item_type: "RENT"
          }
        ]
      }

      await axios.post("/payments/invoices/", payload)
      
      toast({
        title: "Success",
        description: "Invoice created successfully",
      })
      
      setOpen(false)
      setFormData({
        tenant: "",
        amount: "",
        dueDate: "",
        description: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tenant</label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {formData.tenant
                    ? tenants?.results.find((tenant) => tenant.id.toString() === formData.tenant)?.user.full_name
                    : "Select tenant..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search tenant..." />
                  <CommandEmpty>No tenant found.</CommandEmpty>
                  <CommandGroup>
                    {tenants?.results.map((tenant) => (
                      <CommandItem
                        key={tenant.id}
                        value={tenant.user.full_name}
                        onSelect={() => {
                          setFormData({ ...formData, tenant: tenant.id.toString() })
                          setOpenCombobox(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.tenant === tenant.id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {tenant.user.full_name} - Unit {tenant.current_unit?.unit_number}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Monthly Rent - February 2024"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}