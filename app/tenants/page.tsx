'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, MessageSquare, Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { TenantOnboardingFlow } from './components/tenant-form'
import { TenantDetails } from './components/tenant-details'
import { TenantEditDialog } from './components/tenant-edit-dialog'
import { TenantGroupDialog } from './components/tenant-group-dialog'
import { Tenant } from './types'
import api from '@/lib/axios'
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { formatCurrency } from '@/lib/utils'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>()
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await api.get(`/tenants/?page=${pageIndex + 1}`)
        setTenants(response.data.results)
        setTotalPages(Math.ceil(response.data.count / pageSize))
      } catch (error) {
        console.error('Error fetching tenants:', error)
        toast({ variant: "destructive", description: "Failed to load tenants" })
      }
    }
    fetchTenants()
  }, [pageIndex, pageSize])

  const handleAddTenant = async (data: any) => {
    try {
      await api.post('/tenants/', data)
      toast({ description: "Tenant created successfully" })
      setIsFormOpen(false)
      const response = await api.get('/tenants/')
      setTenants(response.data.results)
    } catch (error) {
      console.error('Error creating tenant:', error)
      toast({ variant: "destructive", description: "Failed to create tenant" })
    }
  }

  const handleEditTenant = async (data: any) => {
    try {
      await api.put(`/tenants/${selectedTenant?.id}/`, data)
      toast({ description: "Tenant updated successfully" })
      setIsFormOpen(false)
      const response = await api.get('/tenants/')
      setTenants(response.data.results)
    } catch (error) {
      console.error('Error updating tenant:', error)
      toast({ variant: "destructive", description: "Failed to update tenant" })
    }
  }

  // Calculate summary statistics
  const totalActiveUnits = tenants.filter(tenant => tenant.status === 'ACTIVE').length
  
  // Update the calculation to handle potential null/undefined values and ensure number conversion
  const totalRentRevenue = tenants.reduce((total, tenant) => {
    const unitRent = tenant.current_unit?.rent
    return total + (Number(unitRent) || 0)
  }, 0)
  
  // Update balance due calculation to ensure number conversion
  const totalBalanceDue = tenants.reduce((total, tenant) => {
    return total + (Number(tenant.balance_due) || 0)
  }, 0)

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Tenants</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsGroupDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Create Group
          </Button>
          <Button onClick={() => { setIsEditing(false); setIsFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </div>
      
      {/* Add this at the bottom of the component */}
      {isGroupDialogOpen && (
        <TenantGroupDialog
          isOpen={isGroupDialogOpen}
          onClose={() => setIsGroupDialogOpen(false)}
          onSuccess={() => {
            // Optionally refresh any data that needs updating
          }}
          tenants={tenants}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <Users className="h-4 w-4 text-brand-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{totalActiveUnits}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">Active tenants</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rent</CardTitle>
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <DollarSign className="h-4 w-4 text-brand-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRentRevenue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">Total rent revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle>
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <AlertCircle className="h-4 w-4 text-brand-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalBalanceDue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-orange-600" />
              <p className="text-xs text-orange-600">Outstanding payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Directory</CardTitle>
          <CardDescription>Manage all tenant information and communications</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tenants}
            pageCount={totalPages}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            meta={{
              onView: (tenant: Tenant) => {
                setSelectedTenant(tenant)
                setIsDetailsOpen(true)
              },
              onEdit: (tenant: Tenant) => {
                setSelectedTenant(tenant)
                setIsEditing(true)
                setIsFormOpen(true)
              },
              onDelete: async (tenant: Tenant) => {
                if (confirm(`Are you sure you want to delete ${tenant.user?.full_name}?`)) {
                  try {
                    await api.delete(`/tenants/${tenant.id}/`)
                    toast({ description: "Tenant deleted successfully" })
                    // Refresh tenants list
                    const response = await api.get('/tenants/')
                    setTenants(response.data.results)
                  } catch (error) {
                    toast({ variant: "destructive", description: "Failed to delete tenant" })
                  }
                }
              },
              onMoveOut: async (tenant: Tenant) => {
                if (confirm(`Are you sure you want to move out ${tenant.user?.full_name}?`)) {
                  try {
                    // Update tenant status and move_out_date
                    await api.patch(`/tenants/${tenant.id}/`, {
                      status: 'PAST',  // Change from tenant_status to status
                      move_out_date: new Date().toISOString().split('T')[0]
                    })
                    // Free the unit (assuming an endpoint or patch unit)
                    if (tenant.current_unit?.id) {
                      await api.patch(`/units/${tenant.current_unit.id}/`, { unit_status: 'VACANT', current_tenant: null })
                    }
                    toast({ description: "Tenant moved out successfully" })
                    // Refresh tenants list
                    const response = await api.get('/tenants/')
                    setTenants(response.data.results)
                  } catch (error) {
                    toast({ variant: "destructive", description: "Failed to move out tenant" })
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {isFormOpen && !isEditing && (
        <TenantOnboardingFlow 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isFormOpen && isEditing && selectedTenant && (
        <TenantEditDialog
          tenant={selectedTenant}
          isOpen={true}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditing(false);
            setSelectedTenant(undefined);
          }}
          onUpdate={async (updatedTenant: Tenant) => {
            const response = await api.get('/tenants/');
            setTenants(response.data.results);
          }}
        />
      )}

      {selectedTenant && (
        <TenantDetails
          tenant={selectedTenant}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false)
            setSelectedTenant(undefined)
          }}
          onEdit={(tenant: Tenant) => {
            setSelectedTenant(tenant)
            setIsEditing(true)
            setIsDetailsOpen(false)
            setIsFormOpen(true)
          }}
        />
      )}
    </MainLayout>
  )
}