"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface ReceiptProps {
  paymentId: string
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
}

export function Receipt({
  paymentId,
  receiptNumber,
  date,
  tenant,
  amount,
  paymentMethod,
  reference,
  description,
}: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="relative">
      <div className="print:block">
        <Card className="p-8 print:shadow-none">
          <div className="flex justify-between">
            <div>
              <h2 className="text-2xl font-bold">Payment Receipt</h2>
              <p className="text-muted-foreground">#{receiptNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">{date}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <p className="font-medium">Tenant</p>
              <p>{tenant.name}</p>
              <p className="text-muted-foreground">Unit {tenant.unit}</p>
            </div>

            <div>
              <p className="font-medium">Payment Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium">{paymentMethod}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">{reference}</p>
                </div>
              </div>
            </div>

            {description && (
              <div>
                <p className="font-medium">Description</p>
                <p className="text-muted-foreground">{description}</p>
              </div>
            )}

            <div className="mt-8 border-t pt-8 print:hidden">
              <Button onClick={handlePrint} className="w-full">
                Print Receipt
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}