"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis } from "recharts"
import { Download, FileText, TrendingUp, Building, Users } from "lucide-react"

const financialData = [
  { month: "Jan", revenue: 42000, expenses: 28000, profit: 14000 },
  { month: "Feb", revenue: 45000, expenses: 30000, profit: 15000 },
  { month: "Mar", revenue: 48000, expenses: 32000, profit: 16000 },
  { month: "Apr", revenue: 44000, expenses: 29000, profit: 15000 },
  { month: "May", revenue: 47000, expenses: 31000, profit: 16000 },
  { month: "Jun", revenue: 45231, expenses: 30500, profit: 14731 },
]

const occupancyData = [
  { property: "Sunset Apartments", occupied: 24, total: 30, rate: 80 },
  { property: "Downtown Complex", occupied: 18, total: 20, rate: 90 },
  { property: "Garden View", occupied: 12, total: 15, rate: 75 },
]

const pieData = [
  { name: "Occupied", value: 54, color: "#22c55e" },
  { name: "Vacant", value: 11, color: "#f59e0b" },
]

const chartConfig = {
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
  const [reportType, setReportType] = useState("financial")
  const [timeRange, setTimeRange] = useState("6months")

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="financial">Financial Report</SelectItem>
            <SelectItem value="occupancy">Occupancy Report</SelectItem>
            <SelectItem value="maintenance">Maintenance Report</SelectItem>
            <SelectItem value="tenant">Tenant Report</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
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
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$271,231</div>
                <p className="text-xs text-muted-foreground">+8.2% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">$180,500</div>
                <p className="text-xs text-muted-foreground">+5.1% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">$90,731</div>
                <p className="text-xs text-muted-foreground">+12.3% from last period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Performance</CardTitle>
              <CardDescription>Revenue, expenses, and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={financialData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" />
                  <Bar dataKey="profit" fill="var(--color-profit)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "occupancy" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy by Property</CardTitle>
                <CardDescription>Current occupancy rates across all properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {occupancyData.map((property) => (
                  <div key={property.property} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{property.property}</span>
                      <span className="text-sm text-muted-foreground">
                        {property.occupied}/{property.total} units ({property.rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${property.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Occupancy</CardTitle>
                <CardDescription>Total units occupied vs vacant</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Generate and download common reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <FileText className="h-6 w-6 mb-2" />
              <span>Rent Roll</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Building className="h-6 w-6 mb-2" />
              <span>Property Summary</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Users className="h-6 w-6 mb-2" />
              <span>Tenant List</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Financial Summary</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
