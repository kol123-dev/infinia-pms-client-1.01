"use client"

import { useState, useEffect } from "react"
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
  TimeRange
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
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [reportType, timeRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch data based on report type
      if (reportType === "financial" || reportType === "expense") {
        const expensesResponse = await api.get('/properties/expenses/')
        setExpenses(Array.isArray(expensesResponse.data) ? expensesResponse.data : [])
      }
      
      if (reportType === "financial" || reportType === "occupancy") {
        const propertiesResponse = await api.get('/properties/')
        setProperties(propertiesResponse.data.results || [])
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
  }

  const handleExportPDF = () => {
    exportPDF(reportType, financialData, occupancyData, expenses, tenants)
  }

  const handleExportCSV = () => {
    exportCSV(reportType, financialData, occupancyData, expenses, tenants)
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

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
      </div>

      {reportType === "financial" && (
        <FinancialReport financialData={financialData} chartConfig={chartConfig} />
      )}

      {reportType === "occupancy" && (
        <OccupancyReport 
          occupancyData={occupancyData} 
          pieData={pieData} 
          chartConfig={chartConfig} 
        />
      )}

      {reportType === "expense" && (
        <ExpenseReport expenses={expenses} loading={loading} />
      )}

      {reportType === "tenant" && (
        <TenantReport tenants={tenants} loading={loading} />
      )}
    </MainLayout>
  )
}
