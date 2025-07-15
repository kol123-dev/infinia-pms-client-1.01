'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, MessageSquare } from 'lucide-react'
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
import { Tenant } from './types'
import api from '@/lib/axios'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>()

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await api.get('/tenants/')
        setTenants(response.data.results)
      } catch (error) {
        console.error('Error fetching tenants:', error)
        toast({ variant: "destructive", description: "Failed to load tenants" })
      }
    }
    fetchTenants()
  }, [])

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
  const totalActiveUnits = tenants.filter(tenant => tenant.tenant_status === 'ACTIVE').length
  const totalRentRevenue = tenants.reduce((total, tenant) => total + (tenant.rent_amount || 0), 0)
  const totalBalanceDue = tenants.reduce((total, tenant) => total + (tenant.balance_due || 0), 0)

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Tenants</h1>
        <Button onClick={() => { setIsEditing(false); setIsFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalActiveUnits}</div>
            <p className="text-xs text-blue-600/75 dark:text-blue-400/75">Occupied units</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">${totalRentRevenue.toLocaleString()}</div>
            <p className="text-xs text-purple-600/75 dark:text-purple-400/75">Total rent revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${totalBalanceDue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600/75 dark:text-emerald-400/75">Outstanding payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Directory</CardTitle>
          <CardDescription>Manage all tenant information and communications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Lease Period</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {tenant.user?.full_name?.[0] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium">
                          {tenant.user?.full_name || 'Unnamed Tenant'}
                        </p>
                        <p className="text-sm text-muted-foreground">{tenant.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tenant.current_unit?.property?.name || 'No property'}</span>
                      {tenant.current_unit?.unit_number && (
                        <span className="text-sm text-muted-foreground">Unit {tenant.current_unit.unit_number}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {tenant.move_in_date && (
                        <>
                          <span>{new Date(tenant.move_in_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${tenant.current_unit?.rent || '0'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={tenant.tenant_status === 'ACTIVE' ? "default" : "destructive"}
                      className="rounded-md"
                    >
                      {tenant.tenant_status?.toLowerCase() || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTenant(tenant)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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