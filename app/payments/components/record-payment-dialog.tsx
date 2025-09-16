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

interface RecordPaymentDialogProps {
  children: React.ReactNode
}

export function RecordPaymentDialog({ children }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    tenant: "",
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "mpesa",
    reference: "",
    description: ""
  })

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await axios.get("/tenants/")
      return response.data
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tenant || !formData.amount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields"
      })
      return
    }

    try {
      setLoading(true)
      
      await axios.post("/payments/payments/", {
        tenant: formData.tenant,
        amount: parseFloat(formData.amount),
        paid_date: formData.paymentDate,
        payment_method: formData.paymentMethod.toUpperCase(),
        reference: formData.reference,
        description: formData.description
      })
      
      toast({
        title: "Success",
        description: "Payment recorded successfully"
      })
      
      setOpen(false)
      setFormData({
        tenant: "",
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: "mpesa",
        reference: "",
        description: ""
      })
      
      // Optionally refresh the payments list
      window.location.reload()
    } catch (error) {
      console.error('Error recording payment:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment. Please try again."
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
          <DialogTitle>Record New Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant</Label>
            <Select 
              value={formData.tenant} 
              onValueChange={(value) => setFormData({...formData, tenant: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants?.results?.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id.toString()}>
                    {tenant.user.full_name} - Unit {tenant.current_unit?.unit_number || 'N/A'}
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
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
              required
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
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference/Transaction ID</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              placeholder="e.g. MPESA123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.g. Rent payment for February 2024"
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