"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Link2 } from "lucide-react"
import { BankTransactionMatchDialog } from "./bank-transaction-match-dialog"

export default function BankTransactionList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState<Array<{
    id: string
    reference_number: string
    bank_name: string
    amount: number
    transfer_date: string
    status: string
    verification_status: string
    tenant_name?: string | null
    unit_number?: string | null
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)

  const fetchBankTransfers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/payments/bank/", {
        params: { page: 1, page_size: 10 },
      })
      const items = Array.isArray(data?.results) ? data.results : []
      setTransactions(items)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load bank transfers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBankTransfers()
  }, [fetchBankTransfers])

  // Use a typed, memoized filtered list so TS can resolve types
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((t: typeof transactions[number]) =>
      (t.reference_number || "").toLowerCase().includes(q) ||
      (t.bank_name || "").toLowerCase().includes(q) ||
      (t.tenant_name || "").toLowerCase().includes(q) ||
      (t.unit_number || "").toLowerCase().includes(q)
    )
  }, [transactions, searchTerm])

  const openMatch = (id: string) => {
    setSelectedTransaction(id)
    setIsMatchDialogOpen(true)
  }

  const handleUnmatch = async (id: string) => {
    try {
      await api.post(`/payments/bank/${id}/unmatch/`)
      await fetchBankTransfers()
    } catch (e) {
      console.error('Failed to unmatch bank transaction', e)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {loading && <div className="text-muted-foreground text-sm">Loading...</div>}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Reference #</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.reference_number || "N/A"}</TableCell>
              <TableCell>{t.bank_name || "N/A"}</TableCell>
              <TableCell className="font-medium">{formatCurrency(t.amount || 0)}</TableCell>
              <TableCell>{t.transfer_date ? new Date(t.transfer_date).toLocaleString() : "N/A"}</TableCell>
              <TableCell>
                <Badge variant="outline">{t.status || "N/A"}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={(t.verification_status || "").toUpperCase() === "MATCHED" ? "default" : "secondary"}>
                  {t.verification_status || "PENDING"}
                </Badge>
              </TableCell>
              <TableCell>
                {(t.verification_status || "").toUpperCase() === "PENDING" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => openMatch(t.id)}
                  >
                    <Link2 className="w-4 h-4" />
                    Match
                  </Button>
                )}
                {(t.verification_status || "").toUpperCase() === "MATCHED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => handleUnmatch(t.id)}
                  >
                    Unmatch
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTransaction !== null && (
        <BankTransactionMatchDialog
          isOpen={isMatchDialogOpen}
          onClose={() => setIsMatchDialogOpen(false)}
          transactionId={selectedTransaction!}
          onSuccess={() => {
            setIsMatchDialogOpen(false);
            setSelectedTransaction(null);
            // re-fetch list; prefix with void to avoid ASI call-on-void error
            void (async () => {
              setLoading(true)
              try {
                const { data } = await api.get("/payments/bank/", { params: { page: 1, page_size: 10 } })
                setTransactions(Array.isArray(data?.results) ? data.results : [])
              } finally {
                setLoading(false)
              }
            })()
          }}
        />
      )}
    </div>
  )
}