"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReceiptDialog } from "./receipt-dialog"
import { PaymentDetailsDialog } from "./payment-details-dialog"
import api from "@/lib/axios"

interface Payment {
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
  mpesa_details: {
    transaction_id: string
    transaction_date: string
    status: string
  } | null
  bank_details: any | null
  cash_details: any | null
}

export function PaymentList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/payments/payments/')
        setPayments(response.data.results)
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  const handleDelete = async () => {
    // Refresh the payments list
    const fetchPayments = async () => {
      try {
        const response = await api.get('/payments/payments/')
        setPayments(response.data.results)
      } catch (error) {
        console.error('Error fetching payments:', error)
      }
    }
    fetchPayments()
  }

  const handleEdit = (payment: Payment) => {
    // Navigate to edit page or open edit form
    console.log('Edit payment:', payment)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{payment.tenant?.user?.full_name || 'N/A'}</span>
                    <span className="text-sm text-muted-foreground">{payment.tenant?.user?.email || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{payment.property?.name || 'N/A'}</span>
                    <span className="text-sm text-green-600">Unit {payment.unit?.unit_number || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold">{payment.amount || 0}</TableCell>
                <TableCell>{payment.balance_after || 0}</TableCell>
                <TableCell>{payment.paid_date || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{payment.payment_method || 'N/A'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={payment.payment_status === "PAID" ? "default" : "secondary"}
                  >
                    {payment.payment_status || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <PaymentDetailsDialog
                      payment={payment}
                      onDelete={handleDelete}
                      onEdit={() => handleEdit(payment)}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-blue-50 hover:bg-blue-100 hover:text-blue-600 text-blue-500 border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </PaymentDetailsDialog>
                    {payment.payment_status === "PAID" && (
                      <ReceiptDialog
                        payment={{
                          id: payment.id.toString(),
                          receiptNumber: `REC${payment.payment_id}`,
                          date: payment.paid_date || "",
                          tenant: {
                            name: payment.tenant?.user?.full_name || 'N/A',
                            unit: payment.unit?.unit_number || 'N/A',
                          },
                          amount: payment.amount || 0,
                          paymentMethod: payment.payment_method || "",
                          reference: payment.payment_id,
                          paymentId: payment.payment_id
                        }}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-green-50 hover:bg-green-100 hover:text-green-600 text-green-500 border-green-200"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </ReceiptDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}