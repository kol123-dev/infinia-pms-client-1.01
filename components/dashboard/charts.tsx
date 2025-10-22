"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, Legend } from "recharts"
import { useEffect, useState } from "react"
import axios from "@/lib/axios"

const revenueData = [
  { month: "Jan", revenue: 42000, expenses: 28000 },
  { month: "Feb", revenue: 45000, expenses: 30000 },
  { month: "Mar", revenue: 48000, expenses: 32000 },
  { month: "Apr", revenue: 44000, expenses: 29000 },
  { month: "May", revenue: 47000, expenses: 31000 },
  { month: "Jun", revenue: 45231, expenses: 30500 },
]

const occupancyData = [
  { month: "Jan", rate: 85 },
  { month: "Feb", rate: 88 },
  { month: "Mar", rate: 92 },
  { month: "Apr", rate: 89 },
  { month: "May", rate: 91 },
  { month: "Jun", rate: 87 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(224, 100%, 67%)",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(173, 58%, 39%)",
  },
  rate: {
    label: "Occupancy Rate",
    color: "hsl(224, 100%, 67%)",
  },
}

export function DashboardCharts() {
  // Fetch data from backend, aggregate last 6 months revenue vs expenses, show in KES
  const [chartData, setChartData] = useState<{ month: string; revenue: number; expenses: number }[]>([])

  // New: occupancy trend derived from unit lease periods
  const [occupancyTrend, setOccupancyTrend] = useState<{ month: string; rate: number }[]>([])

  useEffect(() => {
    const fetchRevenueExpenses = async () => {
      try {
        // 1) Fetch payments (assumes auth via axios interceptor)
        let payments: any[] = []
        let nextUrl: string | null = `/payments/payments/?page_size=500`

        // Pull up to 3 pages to cover recent months without heavy load
        let pageCount = 0
        while (nextUrl && pageCount < 3) {
          const res = await axios.get(nextUrl)
          const data: any = res.data
          const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
          payments = payments.concat(results)
          nextUrl = data?.next || null
          pageCount += 1
        }

        // 2) Fetch expenses
        const expRes = await axios.get('/properties/expenses/')
        const expData: any = expRes.data
        const expenses = Array.isArray(expData) ? expData : (Array.isArray(expData?.results) ? expData.results : [])

        // 3) Build last 6 months buckets
        const now = new Date()
        const months: { key: string; month: string; revenue: number; expenses: number }[] = []
        const monthKeys: string[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const label = d.toLocaleString('en-KE', { month: 'short' })
          months.push({ key, month: label, revenue: 0, expenses: 0 })
          monthKeys.push(key)
        }
        const bucketByKey = new Map(months.map(m => [m.key, m]))

        // 4) Aggregate payments: status 'PAID' with a paid_date into revenue
        for (const p of payments) {
          const status = p?.payment_status || p?.status
          const paidDateStr = p?.paid_date
          const amount = Number(p?.amount || 0)
          if (!paidDateStr || String(status).toUpperCase() !== 'PAID') continue
          const d = new Date(paidDateStr)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const bucket = bucketByKey.get(key)
          if (bucket) bucket.revenue += amount
        }

        // 5) Aggregate expenses by date
        for (const e of expenses) {
          const dateStr = e?.date
          const amount = Number(e?.amount || e?.monthly_amount || 0)
          if (!dateStr || !amount) continue
          const d = new Date(dateStr)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const bucket = bucketByKey.get(key)
          if (bucket) bucket.expenses += amount
        }

        setChartData(months.map(m => ({ month: m.month, revenue: m.revenue, expenses: m.expenses })))
      } catch (err) {
        console.error('Error loading revenue vs expenses chart:', err)
        setChartData([])
      }
    }

    fetchRevenueExpenses()
  }, [])

  // New: compute 6-month occupancy from leases
  useEffect(() => {
    const fetchOccupancyTrend = async () => {
      try {
        let units: any[] = []
        let nextUrl: string | null = '/units/?page_size=500'
        let pageCount = 0

        // Pull multiple pages if needed (capped for performance)
        while (nextUrl && pageCount < 5) {
          const res = await axios.get(nextUrl)
          const data: any = res.data
          const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
          units = units.concat(results)
          nextUrl = data?.next || null
          pageCount += 1
        }

        const totalUnits = units.length

        // Build last 6 months buckets
        const now = new Date()
        const months: { key: string; month: string; occupied: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const label = d.toLocaleString('en-KE', { month: 'short' })
          months.push({ key, month: label, occupied: 0 })
        }

        // For each unit, count occupancy for each month based on lease dates
        for (const u of units) {
          const startStr = u?.lease_start_date || u?.leaseStartDate
          const endStr = u?.lease_end_date || u?.leaseEndDate
          const start = startStr ? new Date(startStr) : null
          const end = endStr ? new Date(endStr) : null

          // If we have lease data, determine occupancy for each month bucket
          if (start) {
            for (const m of months) {
              const [year, mm] = m.key.split('-')
              const startOfMonth = new Date(Number(year), Number(mm) - 1, 1)
              const endOfMonth = new Date(Number(year), Number(mm), 0, 23, 59, 59, 999)

              const occupiedDuringMonth = start <= endOfMonth && (!end || end >= startOfMonth)
              if (occupiedDuringMonth) m.occupied += 1
            }
          }
        }

        const trend = months.map(m => ({
          month: m.month,
          rate: totalUnits > 0 ? Math.round((m.occupied / totalUnits) * 100) : 0,
        }))

        setOccupancyTrend(trend)
      } catch (err) {
        console.error('Error loading occupancy trend chart:', err)
        setOccupancyTrend([])
      }
    }

    fetchOccupancyTrend()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="card-enhanced w-full">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold">Revenue vs Expenses</CardTitle>
          <CardDescription className="text-sm">Monthly financial overview with trend analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full h-[340px] md:h-[380px] lg:h-[420px]"
          >
            <BarChart
              data={chartData.length ? chartData : revenueData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 5,
              }}
              barCategoryGap="15%"
            >
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}k`}
                width={60}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [
                  `KES ${value.toLocaleString('en-KE')}`,
                  name === "revenue" ? "Revenue" : "Expenses",
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                iconType="rect"
                className="chart-legend"
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[2, 2, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[2, 2, 0, 0]} name="Expenses" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-enhanced w-full">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold">Occupancy Rate Trend</CardTitle>
          <CardDescription className="text-sm">6-month occupancy performance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full h-[340px] md:h-[380px] lg:h-[420px]"
          >
            <LineChart
              data={occupancyTrend.length ? occupancyTrend : occupancyData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                domain={[70, 100]}
                tickFormatter={(value) => `${value}%`}
                width={35}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value}%`, "Occupancy Rate"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-rate)", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, stroke: "var(--color-rate)", strokeWidth: 2, fill: "var(--color-rate)" }}
                name="Occupancy Rate"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
