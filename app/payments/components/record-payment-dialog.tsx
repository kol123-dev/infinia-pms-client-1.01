"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from "@tanstack/react-query"
import axios from "@/lib/axios"
import { useUser } from "@/lib/context/user-context"

interface RecordPaymentDialogProps {
  children: React.ReactNode
}

export function RecordPaymentDialog({ children }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()
  
  const [formData, setFormData] = useState({
    tenant: "",
    property: "",
    unit: "",
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    paymentType: "RENT",
    reference: "CASH",
    description: "RENT PAYMENT"
  })

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await axios.get("/tenants/")
      return response.data
    }
  })

  const handleTenantChange = (tenantId: string) => {
    const selectedTenant = tenants?.results.find((t: any) => t.id.toString() === tenantId)
    setFormData({
      ...formData,
      tenant: tenantId,
      property: selectedTenant?.current_unit?.property?.id || "",
      unit: selectedTenant?.current_unit?.id || ""
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tenant || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      // Find the selected tenant's data
      const selectedTenant = tenants?.results.find((t: any) => t.id.toString() === formData.tenant)
      
      // Create payment record with correct field names
      const paymentResponse = await axios.post("/payments/payments/", {
        tenant: formData.tenant,
        property: selectedTenant?.current_unit?.property?.id,
        unit: selectedTenant?.current_unit?.id,
        amount: parseFloat(formData.amount),
        paid_date: formData.paymentDate,
        payment_status: formData.paymentStatus,
        payment_method: formData.paymentMethod,
        payment_type: formData.paymentType,
        account_reference: formData.reference,
      })

      // If it's a cash payment, create the cash payment record
      if (formData.paymentMethod === "CASH") {
        await axios.post("/payments/cash/", {
          payment: paymentResponse.data.id,
          amount: parseFloat(formData.amount),
          received_by: user?.id,
          notes: formData.description
        })
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully"
      })
      
      setOpen(false)
      setFormData({
        tenant: "",
        property: "",
        unit: "",
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        paymentType: "RENT",
        reference: "CASH",
        description: "RENT PAYMENT"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.property?.[0] || error.message || "Failed to record payment",
        variant: "destructive"
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
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant</Label>
            <Select 
              value={formData.tenant} 
              onValueChange={handleTenantChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants?.results.map((tenant: any) => (
                  <SelectItem 
                    key={tenant.id} 
                    value={tenant.id.toString()}
                  >
                    {tenant?.user?.full_name || "Unknown"} - Unit {tenant?.current_unit?.unit_number ?? "N/A"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="MPESA">M-Pesa</SelectItem>
                <SelectItem value="BANK">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select 
              value={formData.paymentStatus} 
              onValueChange={(value) => setFormData({...formData, paymentStatus: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select 
              value={formData.paymentType} 
              onValueChange={(value) => setFormData({...formData, paymentType: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RENT">Rent Payment</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="UTILITY">Utility Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference/Transaction ID</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              placeholder="Enter reference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter description"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}