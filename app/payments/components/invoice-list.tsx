"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { Check, Clock, AlertTriangle, Loader2 } from "lucide-react"
import axios from "@/lib/axios"
import { Eye, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  due_date: string
  paid_date: string | null
  status: string
  tenant: {
    id: number
    tenant_id: string | null
    user: {
      id: number
      email: string
      full_name: string
      phone: string
      role: string
      is_active: boolean
    }
  }
  unit: {
    id: number
    unit_id: string | null
    unit_number: string
    property: {
      id: number
      property_id: string | null
      name: string
      address: string
    }
  }
  payment_method: string | null
}

export function InvoiceList() {
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const { data: invoicesData, isLoading, error } = useQuery<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Invoice[];
  }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await axios.get("/payments/invoices/")
      return response.data
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <Badge className="bg-blue-500 hover:bg-blue-600">paid</Badge>
          </div>
        )
      case "overdue":
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <Badge variant="destructive">overdue</Badge>
          </div>
        )
      case "sent":
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <Badge variant="outline" className="text-orange-500 border-orange-500">pending</Badge>
          </div>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-red-500">
        Error loading invoices. Please try again later.
      </div>
    )
  }

  const filteredInvoices = (invoicesData?.results || []).filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.tenant.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.unit.property.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendSMS = async (invoice: Invoice) => {
    try {
      await axios.post(`/communications/`, {
        recipients: [invoice.tenant.id], // Changed to array of tenant IDs
        landlord: 1, // You'll need to provide the correct landlord ID
        body: `Dear ${invoice.tenant.user.full_name},\n\nThis is a reminder about invoice ${invoice.invoice_number} for ${formatCurrency(invoice.amount)}, due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nThank you.`
      })
      
      toast({
        title: "Success",
        description: "Invoice SMS sent successfully"
      })
    } catch (error) {
      console.error('Error sending SMS:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send SMS notification"
      })
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search invoices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Invoice #</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{invoice.tenant.user.full_name}</span>
                  <span className="text-sm text-muted-foreground">{invoice.tenant.user.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{invoice.unit.property.name}</span>
                  <span className="text-sm text-green-600">Unit {invoice.unit.unit_number}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
              <TableCell>{invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : "-"}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell>{invoice.payment_method || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleSendSMS(invoice)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}