"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import api from "@/lib/axios"

export function BankTransactionList() {
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

  useEffect(() => {
    const fetchBankTransfers = async () => {
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
    }
    fetchBankTransfers()
  }, [])

  const filtered = transactions.filter((t) => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true
    return (
      (t.reference_number || "").toLowerCase().includes(q) ||
      (t.bank_name || "").toLowerCase().includes(q) ||
      (t.tenant_name || "").toLowerCase().includes(q) ||
      (t.unit_number || "").toLowerCase().includes(q)
    )
  })

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
          {filtered.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.reference_number}</TableCell>
              <TableCell>{t.bank_name}</TableCell>
              <TableCell>{formatCurrency(Number(t.amount || 0))}</TableCell>
              <TableCell>{new Date(t.transfer_date).toLocaleDateString()}</TableCell>
              <TableCell>{t.tenant_name || "-"}</TableCell>
              <TableCell>{t.unit_number || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={t.verification_status?.toLowerCase() === "matched" ? "default" : "secondary"}
                >
                  {t.verification_status || t.status || "pending"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}