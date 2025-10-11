"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import { OccupancyData, PieData, ChartConfig, UnitForReport } from "../types"

interface OccupancyReportProps {
  occupancyData: OccupancyData[]
  pieData: PieData[]
  chartConfig: ChartConfig
  units: UnitForReport[]
  loading?: boolean
}

export function OccupancyReport({ occupancyData, pieData, chartConfig, units, loading }: OccupancyReportProps) {
  // Helper to compute status counts per property using units
  const getCounts = (propertyName: string) => {
    const unitsForProp = (units || []).filter(u => u.property?.name === propertyName)
    const occupied = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "OCCUPIED").length
    const vacant = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "VACANT").length
    const maintenance = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "MAINTENANCE").length
    // Fallback to occupancyData totals if units are not available
    const totalFromData = occupancyData.find(d => d.property === propertyName)?.total ?? 0
    const total = unitsForProp.length > 0 ? unitsForProp.length : totalFromData
    return { occupied, vacant, maintenance, total }
  }
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
      <Card>
        <CardHeader>
          <CardTitle>Unit Directory</CardTitle>
          <CardDescription>All units with current and past tenants, status, type, and rent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Unit</th>
                  <th className="p-2 text-left font-medium">Property</th>
                  <th className="p-2 text-left font-medium">Type</th>
                  <th className="p-2 text-left font-medium">Status</th>
                  <th className="p-2 text-left font-medium">Rent</th>
                  <th className="p-2 text-left font-medium">Current Tenant</th>
                  <th className="p-2 text-left font-medium">Past Tenant</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Loading units...</p>
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No units found</p>
                    </td>
                  </tr>
                ) : (
                  units.map((u) => {
                    const past = (u.tenant_history || [])
                      .filter(h => h.end_date)
                      .sort((a, b) => new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime())[0]
                    return (
                      <tr key={u.id} className="border-b">
                        <td className="p-2">{u.unit_number}</td>
                        <td className="p-2">{u.property?.name || ''}</td>
                        <td className="p-2">{u.unit_type}</td>
                        <td className="p-2">{u.unit_status}</td>
                        <td className="p-2">
                          {typeof u.rent === 'number' ? u.rent.toLocaleString() : u.rent || ''}
                        </td>
                        <td className="p-2">{u.current_tenant?.user?.full_name || 'None'}</td>
                        <td className="p-2">{past?.tenant?.user?.full_name || 'None'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New: Occupancy Summary table with statuses */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Summary</CardTitle>
          <CardDescription>Units by status per property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Property</th>
                  <th className="p-2 text-left font-medium">Occupied</th>
                  <th className="p-2 text-left font-medium">Vacant</th>
                  <th className="p-2 text-left font-medium">Maintenance</th>
                  <th className="p-2 text-left font-medium">Total</th>
                  <th className="p-2 text-left font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {occupancyData.map((p) => {
                  const c = getCounts(p.property)
                  const rate = c.total > 0 ? Math.round((c.occupied / c.total) * 100) : p.rate
                  return (
                    <tr key={p.property} className="border-b">
                      <td className="p-2">{p.property}</td>
                      <td className="p-2">{c.occupied}</td>
                      <td className="p-2">{c.vacant}</td>
                      <td className="p-2">{c.maintenance}</td>
                      <td className="p-2">{c.total}</td>
                      <td className="p-2">{rate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}