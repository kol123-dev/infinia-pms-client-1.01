"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Receipt } from "./receipt"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface ReceiptDialogProps {
  children?: ReactNode
  payment: {
    id: string
    receiptNumber: string
    date: string
    tenant: {
      name: string
      unit: string
    }
    amount: number
    paymentMethod: string
    reference: string
    description?: string
    paymentId: string
  }
}

export function ReceiptDialog({ payment, children }: ReceiptDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            View Receipt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            Receipt #{payment.receiptNumber} for {payment.tenant.name}
          </DialogDescription>
        </DialogHeader>
        <Receipt {...payment} paymentId={payment.paymentId} />
      </DialogContent>
    </Dialog>
  )
}