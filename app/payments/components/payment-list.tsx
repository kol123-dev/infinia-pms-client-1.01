"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, Filter, X, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReceiptDialog } from "./receipt-dialog"
import { PaymentDetailsDialog } from "./payment-details-dialog"
import api from "@/lib/axios"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  const columns: ColumnDef[] = [
    { key: "tenant", label: "Tenant Name", type: "string", accessor: (p) => p.tenant?.user?.full_name ?? "" },
    { key: "tenant_email", label: "Tenant Email", type: "string", accessor: (p) => p.tenant?.user?.email ?? "" },
    { key: "property", label: "Property", type: "string", accessor: (p) => p.property?.name ?? "" },
    { key: "unit", label: "Unit", type: "string", accessor: (p) => p.unit?.unit_number ?? "" },
    { key: "amount", label: "Amount", type: "number", accessor: (p) => Number(p.amount ?? 0) },
    { key: "balance_after", label: "Balance", type: "number", accessor: (p) => Number(p.balance_after ?? 0) },
    { key: "paid_date", label: "Date", type: "date", accessor: (p) => (p.paid_date ? new Date(p.paid_date) : undefined) },
    { key: "payment_method", label: "Method", type: "string", accessor: (p) => p.payment_method ?? "" },
    { key: "payment_status", label: "Status", type: "string", accessor: (p) => p.payment_status ?? "" },
  ]

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
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all pages so we have the full dataset for client-side pagination
        const PAGE_SIZE_API = 200
        const all: Payment[] = []
        let pageNum = 1
        let hasNext = true

        while (hasNext) {
          const resp = await api.get('/payments/payments/', {
            params: { page: pageNum, page_size: PAGE_SIZE_API }
          })
          const data = resp.data
          if (data && Array.isArray(data.results)) {
            all.push(...data.results)
          }
          hasNext = Boolean(data?.next)
          pageNum += 1
        }

        setPayments(all)
      } catch (error) {
        console.error('Error fetching payments:', error)
        setError('Failed to load payments. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
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
  const columnDefByKey = (key: ColumnKey) => columns.find((c) => c.key === key)!

  const matchString = (val: string, op: StringOperator, comp: string) => {
    const v = (val ?? "").toLowerCase()
    const c = (comp ?? "").toLowerCase()
    switch (op) {
      case "contains": return v.includes(c)
      case "equals": return v === c
      case "startsWith": return v.startsWith(c)
      case "endsWith": return v.endsWith(c)
    }
  }

  const matchNumber = (val: number, op: NumberOperator, comp: string, compTo?: string) => {
    const num = Number(val)
    const c = Number(comp)
    const t = compTo !== undefined ? Number(compTo) : undefined
    switch (op) {
      case "equals": return num === c
      case "greaterThan": return num > c
      case "lessThan": return num < c
      case "between": return t !== undefined ? num >= Math.min(c, t) && num <= Math.max(c, t) : false
    }
  }

  const normalizeDateInput = (input: string) => {
    const d = new Date(input)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const matchDate = (val: Date | undefined, op: DateOperator, comp: string, compTo?: string) => {
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
  }

  const applyFilters = (list: Payment[]) => {
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
  }

  const applyGlobalSearch = (list: Payment[]) => {
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
  }

  // Sorting state
  type SortDirection = "asc" | "desc" | null
  const [sortKey, setSortKey] = useState<ColumnKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
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
  
  const applySort = (list: Payment[]) => {
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
  }

  const filteredPayments = useMemo(() => {
    let list = [...payments]
    list = applyGlobalSearch(list)
    list = applyFilters(list)
    return list
  }, [payments, searchTerm, filters])

  // Apply sorting before pagination
  const sortedPayments = useMemo(
    () => applySort(filteredPayments),
    [filteredPayments, sortKey, sortDirection]
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

  // Reset page on filter/search/sort change
  useEffect(() => {
    setPage(1)
  }, [filters, searchTerm, sortKey, sortDirection])

  // Clamp page when total pages change
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const handleDelete = async () => {
    // This should ideally re-trigger the main fetch effect
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/payments/payments/')
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
        <div className="flex items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowFilters((s) => !s)} className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            {filters.length > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="h-9">
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
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

                <TableHead className="hidden sm:table-cell">
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
  )
}