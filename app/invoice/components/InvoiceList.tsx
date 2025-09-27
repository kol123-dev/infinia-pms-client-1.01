"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils" // Adjust if your utils file has this
import { Check, Clock, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Eye, MessageSquare, Trash2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import axios from "@/lib/axios"
import { Invoice } from "@/types/invoice" // Import your Invoice type
import { useInvoices } from "@/hooks/useInvoices" // Your existing hook for fetching

interface InvoiceListProps {
  invoices?: Invoice[]; // Optional: If passing from page.tsx
  onDelete?: (id: number) => void; // Optional: If handling delete in parent
}

export function InvoiceList({ invoices: propInvoices, onDelete: propOnDelete }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null); // Manual error state

  const { invoicesData, loading, page, setPage, fetchInvoices } = useInvoices(); // Added fetchInvoices to fix scoping error

  const { toast } = useToast()

  // Use propInvoices if provided, else from hook
  const invoiceResults = propInvoices || invoicesData.results || [];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-red-500">
        {error}
      </div>
    )
  }

  const filteredInvoices = invoiceResults.filter(invoice =>
    (invoice?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) || // Fixed 'invoice_number'
    (invoice?.tenant?.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? 
     invoice?.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) || // Fixed 'tenant' and 'tenant_name'
    (invoice?.unit?.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? 
     invoice?.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) // Fixed 'unit' and 'property_name'
  )

  const handleSendSMS = async (invoice: Invoice) => {
    try {
      await axios.post(`/communications/`, {
        recipients: [invoice.tenant?.id ?? 0], // Safe fallback
        landlord: 1,
        body: `Dear ${invoice?.tenant?.user?.full_name ?? invoice?.tenant_name ?? ''},\n\nThis is a reminder about invoice ${invoice?.invoice_number ?? 'unknown'} for ${formatCurrency(invoice?.amount ?? 0)}, due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nThank you.` // Fixed 'tenant', 'tenant_name', 'invoice_number', 'amount'
      })
      toast({ title: "Success", description: "Invoice SMS sent successfully" })
    } catch (err) {
      setError("Failed to send SMS notification");
      toast({ variant: "destructive", title: "Error", description: "Failed to send SMS notification" })
    }
  }

  const handleDelete = async (invoice: Invoice) => {
    try {
      await axios.delete(`/payments/invoices/${invoice.id}/`)
      toast({ title: "Success", description: "Invoice deleted successfully" })
      if (propOnDelete && invoice.id !== undefined) propOnDelete(invoice.id); // Add guard for undefined
      else fetchInvoices(page); // Now accessible
    } catch (err) {
      setError("Failed to delete invoice");
      toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice" })
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsEditMode(true)
    // Implement edit logic
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search invoices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Invoice #</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="hidden sm:table-cell">Paid Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Method</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            // Inside the filteredInvoices.map function (around line 130-140)
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice?.id ?? Math.random()}>
                <TableCell className="font-medium">{invoice?.invoice_number ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice?.tenant?.user?.full_name ?? invoice?.tenant_name ?? '-'}</span>
                    <span className="text-sm text-muted-foreground">{invoice?.tenant?.user?.email ?? '-'}</span>
                  </div>
                </TableCell>
                {/* Rest of the cells */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => p + 1)}
          // Disable if no more pages; adjust based on your hook's pagination data
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}