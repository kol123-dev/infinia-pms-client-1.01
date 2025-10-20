"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReceiptDialog } from "./receipt-dialog"
import { PaymentDetailsDialog } from "./payment-details-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  const filteredPayments = useMemo(() => {
    let list = [...payments]
    list = applyGlobalSearch(list)
    list = applyFilters(list)
    return list
  }, [payments, searchTerm, filters])

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
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => {
                  const col = columnDefByKey(f.column)
                  const label =
                    f.operator === "between"
                      ? `${col.label} ${f.operator} ${f.value} — ${f.valueTo}`
                      : `${col.label} ${f.operator} ${f.value}`
                  return (
                    <Badge key={f.id} variant="secondary" className="flex items-center gap-1">
                      {label}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
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
              {filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
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