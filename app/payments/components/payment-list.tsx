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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/payments/payments/') // Updated endpoint path
        // Check if response.data exists and has results property
        if (response.data && Array.isArray(response.data.results)) {
          setPayments(response.data.results)
        } else {
          setPayments([])
        }
      } catch (error) {
        console.error('Error fetching payments:', error)
        setError('Failed to load payments. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const handleDelete = async () => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/payments/payments/') // Updated endpoint path
        if (response.data && Array.isArray(response.data.results)) {
          setPayments(response.data.results)
        } else {
          setPayments([])
        }
      } catch (error) {
        console.error('Error fetching payments:', error)
        setError('Failed to load payments. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }

  const handleEdit = (payment: Payment) => {
    console.log('Edit payment:', payment)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => handleDelete()} // Reuse handleDelete as it already has the fetch logic
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Balance</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments && payments.length > 0 ? (
                payments.map((payment) => (
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
                    <TableCell className="hidden sm:table-cell">{payment.balance_after || 0}</TableCell>
                    <TableCell>{payment.paid_date || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No payments found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}