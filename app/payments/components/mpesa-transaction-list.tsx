"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/axios"

interface MpesaTransaction {
  id: number
  transaction_id: string
  phone_number: string
  amount: string
  paybill_number: string
  account_reference: string
  transaction_date: string
  status: string
  result_code: string
  result_description: string
}

export function MpesaTransactionList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/payments/mpesa/')
        setTransactions(response.data.results)
      } catch (error) {
        console.error('Error fetching M-Pesa transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case "UNMATCHED":
        return <Badge variant="destructive">Unmatched</Badge>
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getActionButton = (status: string) => {
    if (status.toUpperCase() === "UNMATCHED") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <Link2 className="w-4 h-4" />
          Match Transaction
        </Button>
      )
    }
    return null
  }

  if (loading) {
    return <div>Loading...</div>
  }

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
          <TableRow className="bg-muted/50">
            <TableHead>Transaction ID</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Account Ref</TableHead>
            <TableHead>Paybill</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.transaction_id}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{transaction.phone_number}</span>
                  <span className="text-sm text-muted-foreground">{transaction.result_description}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(parseFloat(transaction.amount))}</TableCell>
              <TableCell>{new Date(transaction.transaction_date).toLocaleString()}</TableCell>
              <TableCell>{transaction.account_reference}</TableCell>
              <TableCell>{transaction.paybill_number}</TableCell>
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              <TableCell>{getActionButton(transaction.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}