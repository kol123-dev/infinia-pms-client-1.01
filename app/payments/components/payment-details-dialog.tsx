import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Edit, Trash } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "@/hooks/use-toast"

interface PaymentDetailsDialogProps {
  payment: {
    id: number
    payment_id: string
    property: {
      name: string
    }
    tenant: {
      user: {
        email: string
        full_name: string
        phone: string
      }
      current_unit: {
        unit_number: string
      }
    }
    unit: {
      unit_number: string
    }
    amount: number
    balance_after: number
    paid_date: string
    payment_status: string
    payment_method: string
    payment_type: string
  }
  children: React.ReactNode
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

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Tenant Information</h4>
                <p className="text-sm">{payment.tenant.user.full_name}</p>
                <p className="text-sm text-muted-foreground">{payment.tenant.user.email}</p>
                <p className="text-sm text-muted-foreground">{payment.tenant.user.phone}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Property Information</h4>
                <p className="text-sm">{payment.property.name}</p>
                <p className="text-sm text-muted-foreground">Unit {payment.unit.unit_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Payment Information</h4>
                <p className="text-sm">Amount: ${payment.amount}</p>
                <p className="text-sm">Balance After: ${payment.balance_after}</p>
                <p className="text-sm">Date: {payment.paid_date}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Payment Details</h4>
                <p className="text-sm">Method: {payment.payment_method}</p>
                <p className="text-sm">Type: {payment.payment_type}</p>
                <p className="text-sm">Status: {payment.payment_status}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit()}
              className="bg-blue-50 hover:bg-blue-100 hover:text-blue-600 text-blue-500 border-blue-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-50 hover:bg-red-100 hover:text-red-600 text-red-500 border-red-200"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
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