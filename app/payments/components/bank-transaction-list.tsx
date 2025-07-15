"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

export function BankTransactionList() {
  const [searchTerm, setSearchTerm] = useState("")

  const transactions = [
    {
      id: "1",
      reference: "TRF123456",
      bank: "KCB Bank",
      amount: 25000,
      date: "2024-01-15",
      status: "matched",
      tenant: "John Doe",
      unit: "A101",
    },
    // Add more sample data
  ]

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.reference}</TableCell>
              <TableCell>{transaction.bank}</TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.tenant}</TableCell>
              <TableCell>{transaction.unit}</TableCell>
              <TableCell>
                <Badge
                  variant={transaction.status === "matched" ? "default" : "secondary"}
                >
                  {transaction.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}