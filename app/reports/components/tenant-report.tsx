"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Tenant } from "../types"

interface TenantReportProps {
  tenants: Tenant[]
  loading: boolean
}

export function TenantReport({ tenants, loading }: TenantReportProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant Report</CardTitle>
          <CardDescription>Complete tenant directory and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Name</th>
                  <th className="p-2 text-left font-medium">Email</th>
                  <th className="p-2 text-left font-medium">Phone</th>
                  <th className="p-2 text-left font-medium">Status</th>
                  <th className="p-2 text-left font-medium">Unit</th>
                  <th className="p-2 text-left font-medium">Property</th>
                  <th className="p-2 text-left font-medium">Lease Start</th>
                  <th className="p-2 text-left font-medium">Lease End</th>
                  <th className="p-2 text-left font-medium">Rent</th>
                  <th className="p-2 text-left font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">Loading tenants...</p>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">No tenants found</p>
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b">
                      <td className="p-2">{tenant.user?.full_name || ''}</td>
                      <td className="p-2">{tenant.user?.email || ''}</td>
                      <td className="p-2">{tenant.user?.phone || ''}</td>
                      {/* Status: prefer 'status', fallback to 'tenant_status' */}
                      <td className="p-2">{tenant.status || tenant.tenant_status || ''}</td>
                      <td className="p-2">{tenant.current_unit?.unit_number || 'None'}</td>
                      <td className="p-2">{tenant.property_name || tenant.current_unit?.property?.name || 'None'}</td>
                      <td className="p-2">
                        {tenant.lease_start_date ? new Date(tenant.lease_start_date).toLocaleDateString() : 
                         tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-2">
                        {tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : 
                         tenant.move_out_date ? new Date(tenant.move_out_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-2">
                        {tenant.rent_amount ? formatCurrency(tenant.rent_amount) : 
                         tenant.current_unit?.rent ? formatCurrency(parseFloat(tenant.current_unit.rent)) : 'N/A'}
                      </td>
                      <td className="p-2">{tenant.balance ? formatCurrency(tenant.balance) : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}