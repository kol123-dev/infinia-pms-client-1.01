"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link2, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"
import { MpesaTransactionMatchDialog } from './mpesa-transaction-match-dialog'

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
  first_name: string
  middle_name: string
  last_name: string
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: MpesaTransaction[]
}

export function MpesaTransactionList() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const pageSize = 10
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null)
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)
  
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const response = await api.get<PaginatedResponse>('/payments/mobilepay/', {
          params: {
            page: currentPage,
            page_size: pageSize,
            search: searchTerm,
          }
        })
        setTransactions(response.data.results)
        setTotalItems(response.data.count)
        setTotalPages(Math.ceil(response.data.count / pageSize))
      } catch (error) {
        console.error('Error fetching M-Pesa transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchTransactions()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [currentPage, searchTerm])

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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    setDeleting(id)
    try {
      await api.delete(`/payments/mobilepay/${id}/`)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const getActionButton = (transaction: MpesaTransaction) => {
    const { status, id } = transaction
    const isDeleting = deleting === id

    // Allow manual match for any non-final status
    const canMatch = ["UNMATCHED", "PENDING_REVIEW", "PENDING", "ERROR"].includes((status || "").toUpperCase())

    return (
      <div className="flex items-center gap-2">
        {canMatch && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600"
            onClick={() => handleMatchClick(id)}
          >
            <Link2 className="w-4 h-4" />
            Match
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => handleDelete(id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete
        </Button>
      </div>
    )
  }

  const handleMatchClick = (transactionId: number) => {
    setSelectedTransaction(transactionId)
    setIsMatchDialogOpen(true)
  }
  
  const handleMatchSuccess = () => {
    // Refresh the transactions list
    refetch()
  }
  
  const refetch = async () => {
    setLoading(true)
    try {
      const response = await api.get<PaginatedResponse>('/payments/mobilepay/', {
        params: {
          page: currentPage,
          page_size: pageSize,
          search: searchTerm,
        }
      })
      setTransactions(response.data.results)
      setTotalItems(response.data.count)
      setTotalPages(Math.ceil(response.data.count / pageSize))
    } catch (error) {
      console.error('Error fetching M-Pesa transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total: {totalItems} transactions</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Transaction ID</TableHead>
                <TableHead>Customer</TableHead>
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
                      <span className="font-medium">
                        {[transaction.first_name, transaction.middle_name, transaction.last_name]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                      <span className="text-sm text-muted-foreground">{transaction.phone_number}</span>
                      <span className="text-xs text-muted-foreground">{transaction.result_description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(parseFloat(transaction.amount))}</TableCell>
                  <TableCell>{new Date(transaction.transaction_date).toLocaleString()}</TableCell>
                  <TableCell>{transaction.account_reference}</TableCell>
                  <TableCell>{transaction.paybill_number}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    {getActionButton(transaction)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Add the match dialog */}
      
      {selectedTransaction && (
        <MpesaTransactionMatchDialog
          isOpen={isMatchDialogOpen}
          onClose={() => setIsMatchDialogOpen(false)}
          transactionId={selectedTransaction.toString()}
          onSuccess={handleMatchSuccess}
        />
      )}
    </div>
  )
}