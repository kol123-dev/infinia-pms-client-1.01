"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"
import { 
  FinancialData, 
  OccupancyData, 
  PieData, 
  ChartConfig, 
  Property, 
  Tenant, 
  Payment,
  ReportType,
  TimeRange,
  UnitForReport
} from "./types"
import { Expense } from "@/hooks/useExpenses"
import { FinancialReport } from "./components/financial-report"
import { OccupancyReport } from "./components/occupancy-report"
import { ExpenseReport } from "./components/expense-report"
import { TenantReport } from "./components/tenant-report"
import { exportPDF, exportCSV } from "./utils/export-utils"

// Initial data for charts
const financialData: FinancialData[] = [
  { month: "Jan", revenue: 42000, expenses: 28000, profit: 14000 },
  { month: "Feb", revenue: 45000, expenses: 30000, profit: 15000 },
  { month: "Mar", revenue: 48000, expenses: 32000, profit: 16000 },
  { month: "Apr", revenue: 44000, expenses: 29000, profit: 15000 },
  { month: "May", revenue: 47000, expenses: 31000, profit: 16000 },
  { month: "Jun", revenue: 45231, expenses: 30500, profit: 14731 },
]

const occupancyData: OccupancyData[] = [
  { property: "Sunset Apartments", occupied: 24, total: 30, rate: 80 },
  { property: "Downtown Complex", occupied: 18, total: 20, rate: 90 },
  { property: "Garden View", occupied: 12, total: 15, rate: 75 },
]

const pieData: PieData[] = [
  { name: "Occupied", value: 54, color: "#22c55e" },
  { name: "Vacant", value: 11, color: "#f59e0b" },
]

// Updated chartConfig with index signature
const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-3))",
  },
}

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("financial")
  const [timeRange, setTimeRange] = useState<TimeRange>("6months")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [unitsReport, setUnitsReport] = useState<UnitForReport[]>([])
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
  const [pieData, setPieData] = useState<PieData[]>([])
  const { toast } = useToast()
  const [backendFinancialData, setBackendFinancialData] = useState<FinancialData[]>([])
  const monthlySummaryCacheRef = useRef<Map<string, {
    monthly_revenue: number
    total_expenses: number
    taxable_income: number
    net_profit: number
  }>>(new Map())
  const monthlySummaryPendingRef = useRef<Map<string, Promise<{
    monthly_revenue: number
    total_expenses: number
    taxable_income: number
    net_profit: number
  }>>>(new Map())

  // Add: property filter state (default: all)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>('all')
  const selectedPropertyName = useMemo(
    () => properties.find(p => String(p.id) === selectedPropertyId)?.name,
    [properties, selectedPropertyId]
  )

  // Removed duplicate declarations:
  // - occupancies
  // - payments (duplicate)
  // - loading (duplicate)
  // - unitsReport (duplicate)
  // - occupancyData (duplicate)
  // - pieData (duplicate)
  // - toast (duplicate)
  // - backendFinancialData (duplicate)
  // - monthlySummaryCacheRef (duplicate)
  // - monthlySummaryPendingRef (duplicate)

  const buildBackendFinancial = useCallback(async (propsArr: Property[]) => {
    const months = getMonths(timeRange)
    const aggregated: FinancialData[] = []
    const filteredProps = selectedPropertyId === 'all'
      ? (propsArr || [])
      : (propsArr || []).filter(p => String(p.id) === selectedPropertyId)
  
    for (const m of months) {
      let revenue = 0
      let expenses = 0
      let taxable = 0
      let net = 0
  
      for (const p of filteredProps) {
        const key = `${p.id}-${m.slug}`
        try {
          let cached = monthlySummaryCacheRef.current.get(key)
          if (!cached) {
            let pending = monthlySummaryPendingRef.current.get(key)
            if (!pending) {
              pending = api
                .get(`/properties/expenses/monthly_summary/?property=${p.id}&month=${m.slug}`)
                .then(res => {
                  const d = res.data || {}
                  const normalized = {
                    monthly_revenue: Number(d.monthly_revenue || 0),
                    total_expenses: Number(d.total_expenses || 0),
                    taxable_income: Number(d.taxable_income || 0),
                    net_profit: Number.isFinite(Number(d.net_profit))
                      ? Number(d.net_profit)
                      : (Number(d.monthly_revenue || 0) - Number(d.total_expenses || 0)),
                  }
                  monthlySummaryCacheRef.current.set(key, normalized)
                  monthlySummaryPendingRef.current.delete(key)
                  return normalized
                })
                .catch(() => {
                  const fallback = { monthly_revenue: 0, total_expenses: 0, taxable_income: 0, net_profit: 0 }
                  monthlySummaryCacheRef.current.set(key, fallback)
                  monthlySummaryPendingRef.current.delete(key)
                  return fallback
                })
              monthlySummaryPendingRef.current.set(key, pending)
            }
            cached = await pending
          }
  
          revenue += cached.monthly_revenue
          expenses += cached.total_expenses
          taxable += cached.taxable_income
          net += cached.net_profit
        } catch {
          // Skip on error
        }
      }
  
      aggregated.push({
        month: m.label,
        revenue,
        expenses,
        profit: net,
        taxable_income: taxable,
        net_profit: net,
      })
    }
  
    setBackendFinancialData(aggregated)
  // Add selectedPropertyId to deps to rebuild when filter changes
  }, [timeRange, selectedPropertyId])
  
  // Wrap fetchData with useCallback and depend on buildBackendFinancial
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch expenses with property filter for Financial and Expense reports
      if (reportType === "financial" || reportType === "expense") {
        const expenseUrl = selectedPropertyId === 'all'
          ? '/properties/expenses/'
          : `/properties/expenses/?property=${selectedPropertyId}`
        const expensesResponse = await api.get(expenseUrl)
        setExpenses(Array.isArray(expensesResponse.data) ? expensesResponse.data : [])
      }

      // Ensure properties are loaded for Expense and Tenant filters
      if (reportType === "tenant" || reportType === "expense") {
        const propertiesResponse = await api.get('/properties/')
        setProperties(propertiesResponse.data.results || [])
      }

      if (reportType === "financial" || reportType === "occupancy") {
        const propertiesResponse = await api.get('/properties/')
        const propsArr: Property[] = propertiesResponse.data.results || []  // type propsArr to avoid implicit any
        setProperties(propsArr)

        const unitsResponse = await api.get('/units/?page_size=500')
        const units = unitsResponse.data.results || []

        // Compute selected property name from fresh response instead of state
        const selectedName =
          selectedPropertyId === 'all'
            ? null
            : propsArr.find(p => String(p.id) === selectedPropertyId)?.name ?? null

        const unitsToUse = selectedPropertyId === 'all'
          ? units
          : units.filter((u: UnitForReport) => selectedName ? (u.property?.name === selectedName) : false)

        setUnitsReport(unitsToUse)

        const byProperty: Record<string, { occupied: number; vacant: number; maintenance: number; total: number }> = {}
        unitsToUse.forEach((u: UnitForReport) => {
          const prop = u.property?.name || "Unknown"
          const entry = byProperty[prop] || { occupied: 0, vacant: 0, maintenance: 0, total: 0 }
          entry.total += 1

          const norm = String(u.unit_status ?? "").toUpperCase()
          if (norm.includes("OCCUP")) entry.occupied += 1
          else if (norm.includes("VAC")) entry.vacant += 1
          else if (norm.includes("MAINT")) entry.maintenance += 1
          else entry[u.current_tenant?.user?.full_name ? "occupied" : "vacant"] += 1

          byProperty[prop] = entry
        })

        const occData: OccupancyData[] = Object.entries(byProperty).map(([property, c]) => ({
          property,
          occupied: c.occupied,
          total: c.total,
          rate: c.total > 0 ? Math.round((c.occupied / c.total) * 100) : 0,
        }))
        setOccupancyData(occData)

        const totals = Object.values(byProperty).reduce(
          (acc, c) => {
            acc.occupied += c.occupied
            acc.vacant += c.vacant
            acc.maintenance += c.maintenance
            acc.total += c.total
            return acc
          },
          { occupied: 0, vacant: 0, maintenance: 0, total: 0 }
        )
        setPieData([
          { name: "Occupied", value: totals.occupied, color: "#22c55e" },
          { name: "Vacant", value: totals.vacant, color: "#f59e0b" },
          { name: "Maintenance", value: totals.maintenance, color: "#3b82f6" },
        ])

        if (reportType === "financial") {
          await buildBackendFinancial(propsArr)
        } else {
          setBackendFinancialData([])
        }
      }

      if (reportType === "financial" || reportType === "tenant") {
        const tenantsResponse = await api.get('/tenants/')
        setTenants(tenantsResponse.data.results || [])
      }

      if (reportType === "financial") {
        const paymentsResponse = await api.get('/payments/payments/')
        setPayments(paymentsResponse.data.results || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch report data"
      })
    } finally {
      setLoading(false)
    }
  }, [reportType, selectedPropertyId, buildBackendFinancial, toast])

  // Depend on the stable fetchData
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Single declaration of computedFinancialData
  const computedFinancialData = useMemo<FinancialData[]>(
    () => {
      const source = backendFinancialData.length ? backendFinancialData : financialData
      return source.map(d => ({
        ...d,
        taxable_income: d.taxable_income ?? (d.revenue - d.expenses),
        net_profit: d.net_profit ?? d.profit,
      }))
    },
    [backendFinancialData]
  )

  // New: filter tenants by selected property for Tenant report
  const tenantsFiltered = useMemo(() => {
    if (selectedPropertyId === 'all') return tenants
    return tenants.filter(t => {
      const pname = t.property_name || t.current_unit?.property?.name
      return selectedPropertyName ? pname === selectedPropertyName : false
    })
  }, [tenants, selectedPropertyId, selectedPropertyName])

  // Single declaration of export handlers
  const handleExportPDF = useCallback(() => {
    exportPDF(
      reportType,
      computedFinancialData,
      occupancyData,
      expenses,
      tenantsFiltered,
      unitsReport,
      { property: selectedPropertyName }
    )
  }, [reportType, computedFinancialData, occupancyData, expenses, tenantsFiltered, unitsReport, selectedPropertyName])

  const handleExportCSV = useCallback(() => {
    exportCSV(
      reportType,
      computedFinancialData,
      occupancyData,
      expenses,
      tenantsFiltered,
      unitsReport,
      { property: selectedPropertyName }
    )
  }, [reportType, computedFinancialData, occupancyData, expenses, tenantsFiltered, unitsReport, selectedPropertyName])

  return (
    <MainLayout>
      {/* Polished header + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:flex-nowrap flex-wrap gap-3 md:gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:whitespace-nowrap">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground hidden md:block">
            Export and analyze your property performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg md:h-9 w-full sm:w-auto"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg md:h-9 w-full sm:w-auto"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="financial">Financial Report</SelectItem>
            <SelectItem value="occupancy">Occupancy Report</SelectItem>
            <SelectItem value="expense">Expense Report</SelectItem>
            <SelectItem value="tenant">Tenant Report</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">1 Month</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="6months">6 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Property filter for Financial, Occupancy, Tenant, and Expense */}
        {(reportType === "financial" || reportType === "occupancy" || reportType === "tenant" || reportType === "expense") && (
          <Select
            value={selectedPropertyId}
            onValueChange={(value) => setSelectedPropertyId(value as string)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {reportType === "financial" && (
        <FinancialReport financialData={computedFinancialData} chartConfig={chartConfig} />
      )}

      {reportType === "occupancy" && (
        <OccupancyReport 
          occupancyData={occupancyData} 
          pieData={pieData} 
          chartConfig={chartConfig}
          units={unitsReport}
          loading={loading}
        />
      )}
      {reportType === "expense" && (
        <ExpenseReport expenses={expenses} loading={loading} properties={properties} />
      )}

      {reportType === "tenant" && (
        // Use filtered tenants for Tenant report
        <TenantReport tenants={tenantsFiltered} loading={loading} />
      )}
    </MainLayout>
  )

  // Helper: build month slugs and labels for selected range
  function getMonths(range: TimeRange): { slug: string; label: string }[] {
    const now = new Date()
    const count =
      range === "1month" ? 1 :
      range === "3months" ? 3 :
      range === "6months" ? 6 : 12
    const months: { slug: string; label: string }[] = []
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const slug = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleString(undefined, { month: "short" })
      months.push({ slug, label })
    }
    return months
  }
}


