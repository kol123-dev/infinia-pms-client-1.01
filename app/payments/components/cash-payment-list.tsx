"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

export function CashPaymentList() {
  const [searchTerm, setSearchTerm] = useState("")

  const payments = [
    {
      id: "1",
      receiptNumber: "CASH123456",
      amount: 10000,
      date: "2024-01-15",
      status: "completed",
      tenant: "John Doe",
      property: "Sunset Apartments",
      unit: "A101",
      receivedBy: "Jane Smith"
    },
    {
      id: "2",
      receiptNumber: "CASH123457",
      amount: 15000,
      date: "2024-01-16",
      status: "completed",
      tenant: "Sarah Wilson",
      property: "Downtown Complex",
      unit: "B202",
      receivedBy: "Mike Johnson"
    }
    // Add more sample data
  ]

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search payments..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Receipt #</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
              <TableCell>{payment.tenant}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{payment.property}</span>
                  <span className="text-sm text-green-600">Unit {payment.unit}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{payment.date}</TableCell>
              <TableCell>
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>{payment.receivedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}