"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, Filter, X, ArrowUp, ArrowDown, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReceiptDialog } from "./receipt-dialog"
import { PaymentDetailsDialog } from "./payment-details-dialog"
import api from "@/lib/axios"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { exportPaymentsToPDF, exportPaymentsToXLSX } from "@/app/payments/utils/payment-export"
import { formatCurrency } from "@/lib/utils"

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

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(50)
  const pageSizeOptions = [10, 25, 50, 100, 200]
  const [page, setPage] = useState<number>(1)
  const [hydrating, setHydrating] = useState(false)

  // Column/filter configuration
  type ColumnType = "string" | "number" | "date"
  type ColumnKey =
    | "tenant"
    | "tenant_email"
    | "property"
    | "unit"
    | "amount"
    | "balance_after"
    | "paid_date"
    | "payment_method"
    | "payment_status"

  interface ColumnDef {
    key: ColumnKey
    label: string
    type: ColumnType
    accessor: (p: Payment) => string | number | Date | undefined
  }

  const columns = useMemo<ColumnDef[]>(
    () => [
    { key: "tenant", label: "Tenant Name", type: "string", accessor: (p) => p.tenant?.user?.full_name ?? "" },
    { key: "tenant_email", label: "Tenant Email", type: "string", accessor: (p) => p.tenant?.user?.email ?? "" },
    { key: "property", label: "Property", type: "string", accessor: (p) => p.property?.name ?? "" },
    { key: "unit", label: "Unit", type: "string", accessor: (p) => p.unit?.unit_number ?? "" },
    { key: "amount", label: "Amount", type: "number", accessor: (p) => Number(p.amount ?? 0) },
    { key: "balance_after", label: "Balance", type: "number", accessor: (p) => Number(p.balance_after ?? 0) },
    // Use best available transaction timestamp for sorting: Bank -> Mpesa -> paid_date
    { key: "paid_date", label: "Date", type: "date", accessor: (p) => {
        const src = p.bank_details?.transfer_date || p.mpesa_details?.transaction_date || p.paid_date
        return src ? new Date(src) : undefined
      }
    },
    { key: "payment_method", label: "Method", type: "string", accessor: (p) => p.payment_method ?? "" },
    { key: "payment_status", label: "Status", type: "string", accessor: (p) => p.payment_status ?? "" },
  ],
    []
  )

  // Format helpers
  const formatHumanEAT = (date?: Date): string => {
    if (!date) return "—"
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    return `${fmt.format(date)} EAT`
  }

  const relativeLabel = (date?: Date): string => {
    if (!date) return ""
    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const diffDays = Math.floor((now.getTime() - date.getTime()) / msPerDay)
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return ""
  }

  const getPrimaryDateSource = (p: Payment): { date?: Date; raw?: string } => {
    // Prefer IPN transactionDate for tooltip if present (Bank), otherwise the DB datetime
    const ipnRaw = p.bank_details?.ipn_response?.transactionDate as string | undefined
    const srcString = p.bank_details?.transfer_date || p.mpesa_details?.transaction_date || p.paid_date
    return { date: srcString ? new Date(srcString) : undefined, raw: ipnRaw || srcString }
  }

  const displayDateText = (p: Payment): string => {
    const { date } = getPrimaryDateSource(p)
    const base = formatHumanEAT(date)
    const rel = relativeLabel(date)
    return rel ? `${rel} • ${base}` : base
  }

  const displayDateTitle = (p: Payment): string => {
    const { raw, date } = getPrimaryDateSource(p)
    return raw || (date ? date.toISOString() : "")
  }

  // Format helper: convert any ISO date string to EAT (YYYY-MM-DDTHH:mm:ss+03:00)
  const toEATString = (iso?: string): string => {
    if (!iso) return "N/A"
    const utcMs = new Date(iso).getTime()
    if (Number.isNaN(utcMs)) return iso // if not ISO, return raw
    const eatMs = utcMs + 3 * 60 * 60 * 1000
    const d = new Date(eatMs)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")
    const hh = String(d.getUTCHours()).padStart(2, "0")
    const mm = String(d.getUTCMinutes()).padStart(2, "0")
    const ss = String(d.getUTCSeconds()).padStart(2, "0")
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}+03:00`
  }

  // Choose display date based on payload preference
  const displayDate = (p: Payment): string => {
    // 1) Bank IPN payload exact string if present (e.g., "2025-10-22T15:27:33Z")
    const bankIpnDate = p.bank_details?.ipn_response?.transactionDate
    if (typeof bankIpnDate === "string" && bankIpnDate) return bankIpnDate

    // 2) Bank transfer_date -> show EAT
    const bankTransfer = p.bank_details?.transfer_date
    if (bankTransfer) return toEATString(bankTransfer)

    // 3) Mpesa payload "TransTime" if available (e.g., "20250923205511")
    const mpesaTransTime = p.mpesa_details && (p as any)?.mpesa_details?.ipn_response?.TransTime
    if (typeof mpesaTransTime === "string" && mpesaTransTime) return mpesaTransTime

    // 4) Mpesa transaction_date -> show EAT
    const mpesaDate = p.mpesa_details?.transaction_date
    if (mpesaDate) return toEATString(mpesaDate)

    // 5) Fallback to paid_date -> EAT
    return toEATString(p.paid_date)
  }

  type StringOperator = "contains" | "equals" | "startsWith" | "endsWith"
  type NumberOperator = "equals" | "greaterThan" | "lessThan" | "between"
  type DateOperator = "on" | "before" | "after" | "between"
  type Operator = StringOperator | NumberOperator | DateOperator

  interface FilterCondition {
    id: string
    column: ColumnKey
    operator: Operator
    value?: string
    valueTo?: string
  }

  const operatorsByType: Record<ColumnType, Operator[]> = {
    string: ["contains", "equals", "startsWith", "endsWith"],
    number: ["equals", "greaterThan", "lessThan", "between"],
    date: ["on", "before", "after", "between"],
  }

  // Filter UI state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey>("tenant")
  const [selectedOperator, setSelectedOperator] = useState<Operator>("contains")
  const [filterValue, setFilterValue] = useState<string>("")
  const [filterValueTo, setFilterValueTo] = useState<string>("")

  useEffect(() => {
    let cancelled = false

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))
    const PAGE_SIZE_API = 50

    const fetchInitialWithRetry = async () => {
      setLoading(true)
      setError(null)

      const attempts = [
        { page_size: PAGE_SIZE_API },
        { page_size: 25 }, // fallback smaller payload
      ]

      for (let i = 0; i < attempts.length; i++) {
        try {
          const resp = await api.get('/payments/payments/', {
            params: { page: 1, ...attempts[i] },
          })
          const data = resp.data
          const firstPage = Array.isArray(data?.results) ? data.results : []
          setPayments(firstPage)
          setLoading(false)

          // Begin background hydration; do NOT error the whole table on failures
          let nextUrl: string | null = data?.next || null
          setHydrating(Boolean(nextUrl))

          while (nextUrl && !cancelled) {
            try {
              const nextResp = await api.get(nextUrl)
              const nextData = nextResp.data
              const nextResults = Array.isArray(nextData?.results) ? nextData.results : []

              setPayments((prev) => {
                const merged = [...prev, ...nextResults]
                return Array.from(new Map(merged.map((p) => [p.id, p])).values())
              })

              nextUrl = nextData?.next || null
              setHydrating(Boolean(nextUrl))
            } catch (hydrationErr) {
              console.error('Payments hydration failed; keeping current data:', hydrationErr)
              setHydrating(false)
              break
            }
          }

          return // success path; stop retry loop
        } catch (initialErr) {
          console.error('Error fetching payments (attempt ' + (i + 1) + '):', initialErr)
          // brief backoff before retry, unless last attempt
          if (i < attempts.length - 1) {
            await sleep(500)
          } else {
            setError('Failed to load payments. Please try again later.')
            setLoading(false)
            setHydrating(false)
          }
        }
      }
    }

    fetchInitialWithRetry()

    return () => {
      cancelled = true
    }
  }, [])

  const addFilter = () => {
    if (!filterValue && selectedOperator !== "between") return
    if (selectedOperator === "between" && (!filterValue || !filterValueTo)) return
    const id = `${selectedColumn}-${selectedOperator}-${Date.now()}`
    setFilters((prev) => [
      ...prev,
      { id, column: selectedColumn, operator: selectedOperator, value: filterValue, valueTo: selectedOperator === "between" ? filterValueTo : undefined },
    ])
    setFilterValue("")
    setFilterValueTo("")
  }

  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id))
  const clearFilters = () => setFilters([])
  const columnDefByKey = useCallback(
    (key: ColumnKey) => columns.find((c) => c.key === key)!,
    [columns]
  )

  const matchString = useCallback((val: string, op: StringOperator, comp: string) => {
    const v = (val ?? "").toLowerCase()
    const c = (comp ?? "").toLowerCase()
    switch (op) {
      case "contains": return v.includes(c)
      case "equals": return v === c
      case "startsWith": return v.startsWith(c)
      case "endsWith": return v.endsWith(c)
    }
  }, [])

  const matchNumber = useCallback((val: number, op: NumberOperator, comp: string, compTo?: string) => {
    const num = Number(val)
    const c = Number(comp)
    const t = compTo !== undefined ? Number(compTo) : undefined
    switch (op) {
      case "equals": return num === c
      case "greaterThan": return num > c
      case "lessThan": return num < c
      case "between": return t !== undefined ? num >= Math.min(c, t) && num <= Math.max(c, t) : false
    }
  }, [])

  const normalizeDateInput = (input: string) => {
    const d = new Date(input)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const matchDate = useCallback((val: Date | undefined, op: DateOperator, comp: string, compTo?: string) => {
    if (!val) return false
    const v = startOfDay(val)
    const c = normalizeDateInput(comp)
    const t = compTo ? normalizeDateInput(compTo) : undefined
    switch (op) {
      case "on": return v.getTime() === c.getTime()
      case "before": return v.getTime() < c.getTime()
      case "after": return v.getTime() > c.getTime()
      case "between": return t ? v.getTime() >= Math.min(c.getTime(), t.getTime()) && v.getTime() <= Math.max(c.getTime(), t.getTime()) : false
    }
  }, [])

  const applyFilters = useCallback((list: Payment[]) => {
    if (filters.length === 0) return list
    return list.filter((p) =>
      filters.every((f) => {
        const col = columnDefByKey(f.column)
        const raw = col.accessor(p)
        if (raw === undefined || raw === null) return false
        switch (col.type) {
          case "string": return matchString(String(raw), f.operator as StringOperator, f.value ?? "")
          case "number": return matchNumber(Number(raw), f.operator as NumberOperator, f.value ?? "", f.valueTo)
          case "date": return matchDate(raw as Date, f.operator as DateOperator, f.value ?? "", f.valueTo)
        }
      })
    )
  }, [filters, columnDefByKey, matchString, matchNumber, matchDate])

  const applyGlobalSearch = useCallback((list: Payment[]) => {
    if (!searchTerm.trim()) return list
    const q = searchTerm.toLowerCase()
    return list.filter((p) => {
      const fields = [
        p.payment_id,
        p.tenant?.user?.full_name,
        p.tenant?.user?.email,
        p.property?.name,
        p.unit?.unit_number,
        p.payment_method,
        p.payment_status,
      ]
      return fields.some((f) => (f ?? "").toString().toLowerCase().includes(q))
    })
  }, [searchTerm])

  // Sorting state
  type SortDirection = "asc" | "desc" | null
  const [sortKey, setSortKey] = useState<ColumnKey | null>("paid_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  
  const setSort = (key: ColumnKey, direction: "asc" | "desc") => {
    // Toggle off if clicking the same direction again
    if (sortKey === key && sortDirection === direction) {
      setSortKey(null)
      setSortDirection(null)
    } else {
      setSortKey(key)
      setSortDirection(direction)
    }
  }
  
  const applySort = useCallback((list: Payment[]) => {
    if (!sortKey || !sortDirection) return list
    const col = columnDefByKey(sortKey)

    const sorted = [...list].sort((a, b) => {
      const av = col.accessor(a)
      const bv = col.accessor(b)

      switch (col.type) {
        case "string": {
          const sa = String(av ?? "")
          const sb = String(bv ?? "")
          return sa.localeCompare(sb)
        }
        case "number": {
          const na = Number(av ?? 0)
          const nb = Number(bv ?? 0)
          return na - nb
        }
        case "date": {
          const da = av instanceof Date ? av : new Date(0)
          const db = bv instanceof Date ? bv : new Date(0)
          return da.getTime() - db.getTime()
        }
      }
    })

    return sortDirection === "asc" ? sorted : sorted.reverse()
  }, [sortKey, sortDirection, columnDefByKey])

  const filteredPayments = useMemo(() => {
    let list = [...payments]
    list = applyGlobalSearch(list)
    list = applyFilters(list)
    return list
  }, [payments, applyGlobalSearch, applyFilters])

  // Apply sorting before pagination
  const sortedPayments = useMemo(
    () => applySort(filteredPayments),
    [filteredPayments, applySort]
  )

  // Derived pagination values based on sorted list
  const totalItems = sortedPayments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedPayments = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedPayments.slice(startIndex, endIndex)
  }, [sortedPayments, page, pageSize])

  const showingStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const showingEnd = Math.min(page * pageSize, totalItems)

  const exportRows = useMemo<(string | number)[][]>(() => {
    const fmtDate = (iso?: string): string => {
      if (!iso) return ""
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${y}-${m}-${day}`
    }
    return sortedPayments.map((p) => [
      p.payment_id ?? "",
      p.tenant?.user?.full_name ?? "",
      p.tenant?.user?.email ?? "",
      p.property?.name ?? "",
      p.unit?.unit_number ?? "",
      Number(p.amount ?? 0),
      Number(p.balance_after ?? 0),
      fmtDate(p.paid_date),
      p.payment_method ?? "",
      p.payment_status ?? "",
    ])
  }, [sortedPayments])

  const handleExportPDF = () => {
    const doc = new jsPDF()
    autoTable(doc, {
      head: [["Payment ID", "Tenant", "Email", "Property", "Unit", "Amount", "Balance", "Date", "Method", "Status"]],
      body: exportRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
    })
    doc.save("payments.pdf")
  }

  const handleExportXLSX = () => {
    const header = ["Payment ID", "Tenant", "Email", "Property", "Unit", "Amount", "Balance", "Date", "Method", "Status"]
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportRows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments")
    XLSX.writeFile(workbook, "payments.xlsx")
  }

  // Reset page on filter/search/sort change
  useEffect(() => {
    setPage(1)
  }, [filters, searchTerm, sortKey, sortDirection])

  // Clamp page when total pages change
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const handleDelete = async () => {
    // Re-fetch first page quickly; background hydration resumes via effect
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/payments/payments/', { params: { page: 1, page_size: 50 } })
      const data = response.data
      const firstPage = Array.isArray(data?.results) ? data.results : []
      setPayments(firstPage)
    } catch (error) {
      console.error('Error fetching payments:', error)
      setError('Failed to load payments. Please try again later.')
    } finally {
      setLoading(false)
      // We let the initial effect's hydration handle subsequent pages.
    }
  }

  const handleEdit = (payment: Payment) => {
    console.log('Edit payment:', payment)
  }

  const handleUnmatchCash = async (payment: Payment) => {
    const cashId = payment.cash_details?.id
    if (!cashId) return
    try {
      await api.post(`/payments/cash/${cashId}/unmatch/`)
      await handleDelete() // Re-fetch payments
    } catch (e) {
      console.error('Failed to unmatch cash payment', e)
    }
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
                onClick={handleDelete} // Re-fetches data
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
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CardTitle>Recent Payments</CardTitle>
            {/* Scrollable toolbar on mobile */}
            <div className="overflow-x-auto scrollbar-hide max-w-full">
              <div className="flex items-center gap-2 min-w-max flex-nowrap pr-2">
                <Button variant="outline" onClick={() => setShowFilters((s) => !s)} className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportPaymentsToPDF(exportRows)}
                  className="h-9"
                  disabled={loading || sortedPayments.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportPaymentsToXLSX(exportRows)}
                  className="h-9"
                  disabled={loading || sortedPayments.length === 0}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  XLSX
                </Button>
                {filters.length > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="h-9">
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
        </div>

        {showFilters && (
          <div className="rounded-md border p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Select
                  value={selectedColumn}
                  onValueChange={(v) => {
                    setSelectedColumn(v as ColumnKey)
                    const type = columnDefByKey(v as ColumnKey).type
                    setSelectedOperator(operatorsByType[type][0] as Operator)
                    setFilterValue("")
                    setFilterValueTo("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={selectedOperator}
                  onValueChange={(v) => {
                    setSelectedOperator(v as Operator)
                    setFilterValue("")
                    setFilterValueTo("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorsByType[columnDefByKey(selectedColumn).type].map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {columnDefByKey(selectedColumn).type === "date" ? (
                  <>
                    <Input
                      type="date"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                    {selectedOperator === "between" && (
                      <Input
                        type="date"
                        value={filterValueTo}
                        onChange={(e) => setFilterValueTo(e.target.value)}
                        placeholder="YYYY-MM-DD"
                      />
                    )}
                  </>
                ) : columnDefByKey(selectedColumn).type === "number" ? (
                  <>
                    <Input
                      type="number"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Value"
                    />
                    {selectedOperator === "between" && (
                      <Input
                        type="number"
                        value={filterValueTo}
                        onChange={(e) => setFilterValueTo(e.target.value)}
                        placeholder="To"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Search text"
                  />
                )}
              </div>

              <div>
                <Button className="w-full md:w-auto" onClick={addFilter}>
                  Add Filter
                </Button>
              </div>
            </div>

            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {filters.map((f) => {
                  const col = columnDefByKey(f.column)
                  const label =
                    f.operator === "between"
                      ? `${col.label} ${f.operator} ${f.value} — ${f.valueTo}`
                      : `${col.label} ${f.operator} "${f.value}"`
                  return (
                    <Badge key={f.id} variant="secondary" className="flex items-center gap-1">
                      {label}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeFilter(f.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Tenant</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "tenant" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("tenant", "asc")}
                        aria-label="Sort Tenant ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "tenant" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("tenant", "desc")}
                        aria-label="Sort Tenant descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Property</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "property" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("property", "asc")}
                        aria-label="Sort Property ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "property" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("property", "desc")}
                        aria-label="Sort Property descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Amount</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "amount" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("amount", "asc")}
                        aria-label="Sort Amount ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "amount" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("amount", "desc")}
                        aria-label="Sort Amount descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Balance</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "balance_after" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("balance_after", "asc")}
                        aria-label="Sort Balance ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "balance_after" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("balance_after", "desc")}
                        aria-label="Sort Balance descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Date</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "paid_date" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("paid_date", "asc")}
                        aria-label="Sort Date ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "paid_date" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("paid_date", "desc")}
                        aria-label="Sort Date descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <span>Method</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "payment_method" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("payment_method", "asc")}
                        aria-label="Sort Method ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "payment_method" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("payment_method", "desc")}
                        aria-label="Sort Method descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "payment_status" && sortDirection === "asc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("payment_status", "asc")}
                        aria-label="Sort Status ascending"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-4 w-4 p-0 hover:bg-transparent ${sortKey === "payment_status" && sortDirection === "desc" ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => setSort("payment_status", "desc")}
                        aria-label="Sort Status descending"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableHead>

                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments && paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <TableRow key={`${payment.id}`}>
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
                <TableCell className="font-bold">{formatCurrency(payment.amount || 0)}</TableCell>
                <TableCell>{formatCurrency(payment.balance_after || 0)}</TableCell>
                    {/* Human-friendly date with raw payload in tooltip */}
                    <TableCell>
                      <span title={displayDateTitle(payment)}>
                        {displayDateText(payment)}
                      </span>
                    </TableCell>
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
                              paymentId: payment.payment_id,
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
                        {payment.payment_method === "CASH" && (
                          <Button
                            variant="outline"
                            size="icon"
                            title="Unmatch cash payment"
                            className="h-8 w-8 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 text-amber-600 border-amber-300"
                            onClick={() => handleUnmatchCash(payment)}
                          >
                            U
                          </Button>
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

        {/* Top pagination controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((sz) => (
                  <SelectItem key={sz} value={String(sz)}>
                    {sz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {showingStart}-{showingEnd} of {totalItems}
              {hydrating && " (loading more...)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
              Last
            </Button>
          </div>
        </div>

       

        {/* Removed the duplicate bottom pagination block */}
      </CardContent>
    </Card>
  )}