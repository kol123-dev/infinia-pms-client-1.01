"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"

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
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="card-enhanced">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold">Revenue vs Expenses</CardTitle>
          <CardDescription className="text-sm">Monthly financial overview with trend analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
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
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold">Occupancy Rate Trend</CardTitle>
          <CardDescription className="text-sm">6-month occupancy performance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={occupancyData}
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
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
