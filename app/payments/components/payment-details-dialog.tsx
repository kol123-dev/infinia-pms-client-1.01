import { useState, type ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Edit, Trash } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface PaymentDetailsDialogProps {
  payment: {
    id: number
    payment_id: string
    property: { name: string }
    tenant: {
      user: { email: string; full_name: string; phone: string }
      current_unit: { unit_number: string }
    }
    unit: { unit_number: string }
    amount: number
    balance_after: number
    paid_date: string
    payment_status: string
    payment_method: string
    payment_type: string
    mpesa_details?: { transaction_id?: string; transaction_date?: string; status?: string } | null
    bank_details?: any | null
    cash_details?: any | null
  }
  children: ReactNode
  onDelete: () => void
  onEdit: () => void
}

export function PaymentDetailsDialog({ payment, children, onDelete, onEdit }: PaymentDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await api.delete(`/payments/payments/${payment.id}/`)
      toast({
        title: "Payment deleted",
        description: "The payment has been deleted successfully."
      })
      onDelete()
      setOpen(false)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast({
        title: "Error",
        description: "Failed to delete payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View payment information and manage records
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const isMatched = Boolean(payment?.mpesa_details || payment?.bank_details || payment?.cash_details)
            return (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Transaction Link</span>
                <span className="text-xs">•</span>
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="ml-auto">
                  <Badge variant={isMatched ? "default" : "outline"} className="text-xs h-5">
                    {isMatched ? "matched" : "unmatched"}
                  </Badge>
                </span>
              </div>
            )
          })()}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Tenant Information</h4>
                <p className="text-sm">{payment?.tenant?.user?.full_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{payment?.tenant?.user?.email || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{payment?.tenant?.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Property Information</h4>
                <p className="text-sm">{payment?.property?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Unit {payment?.unit?.unit_number || payment?.tenant?.current_unit?.unit_number || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Payment Information</h4>
                <p className="text-sm">Amount: ${payment?.amount ?? 0}</p>
                <p className="text-sm">Balance After: ${payment?.balance_after ?? 0}</p>
                <p className="text-sm">Date: {payment?.paid_date || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Payment Details</h4>
                <p className="text-sm">Method: {payment?.payment_method || 'N/A'}</p>
                <p className="text-sm">Type: {payment?.payment_type || 'N/A'}</p>
                <p className="text-sm">Status: {payment?.payment_status || 'N/A'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm">Match:</span>
                  <Badge
                    variant={Boolean(payment?.mpesa_details || payment?.bank_details || payment?.cash_details) ? "default" : "outline"}
                    className="text-xs h-5"
                  >
                    {Boolean(payment?.mpesa_details || payment?.bank_details || payment?.cash_details) ? "matched" : "unmatched"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              Delete Payment
            </Button>
            <Button variant="outline" onClick={onEdit}>
              Edit Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}