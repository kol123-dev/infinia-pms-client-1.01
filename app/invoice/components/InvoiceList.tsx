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
    // Implement edit logic (e.g., open an edit form; this matches payments but can be expanded later)
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
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice?.id ?? Math.random()}>
                <TableCell className="font-medium">{invoice?.invoice_number ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice?.tenant?.user?.full_name ?? invoice?.tenant_name ?? '-'}</span>
                    <span className="text-sm text-muted-foreground">{invoice?.tenant?.user?.email ?? '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice?.unit?.property?.name ?? invoice?.property_name ?? '-'}</span>
                    <span className="text-sm text-green-600">Unit {invoice?.unit?.unit_number ?? '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(invoice?.amount ?? 0)}</TableCell>
                <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                <TableCell className="hidden sm:table-cell">{invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="hidden sm:table-cell">{invoice.payment_method || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Invoice Details</DialogTitle>
                          <DialogDescription>
                            Invoice #{invoice?.invoice_number ?? '-'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="font-semibold">Amount:</div>
                            <div className="col-span-3">{formatCurrency(invoice?.amount ?? 0)}</div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="font-semibold">Due Date:</div>
                            <div className="col-span-3">{new Date(invoice.due_date).toLocaleDateString()}</div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="font-semibold">Status:</div>
                            <div className="col-span-3">{getStatusBadge(invoice.status)}</div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="font-semibold">Tenant:</div>
                            <div className="col-span-3">{invoice?.tenant?.user?.full_name ?? invoice?.tenant_name ?? '-'}</div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="font-semibold">Property:</div>
                            <div className="col-span-3">{invoice?.unit?.property?.name ?? invoice?.property_name ?? '-'} - Unit {invoice?.unit?.unit_number ?? '-'}</div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => handleEdit(invoice)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" onClick={() => {
                            setIsDeleteDialogOpen(true)
                            setSelectedInvoice(invoice)
                          }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
      
      {/* Add pagination controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, invoicesData?.count || 0)} of {invoicesData?.count || 0} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!invoicesData?.next}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice #{selectedInvoice?.invoice_number ?? '-'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedInvoice) {
                  handleDelete(selectedInvoice)
                  setIsDeleteDialogOpen(false)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}