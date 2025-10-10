"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import { OccupancyData, PieData, ChartConfig } from "../types"

interface OccupancyReportProps {
  occupancyData: OccupancyData[]
  pieData: PieData[]
  chartConfig: ChartConfig
}

export function OccupancyReport({ occupancyData, pieData, chartConfig }: OccupancyReportProps) {
  return (
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
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}