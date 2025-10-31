'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/axios'
import { useUser } from '@/lib/context/user-context'
import { FileText, Building, User } from 'lucide-react'

export default function TenantPropertyPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [tenant, setTenant] = useState<any | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/signin')
      return
    }
    if (user.role !== 'tenant') {
      router.replace('/dashboard')
      return
    }
    const load = async () => {
      try {
        const tRes = await api.get('/tenants/?page=1')
        const list = tRes.data?.results || []
        const mine = list.find((t: any) => t?.user?.id === user.id) || null
        setTenant(mine)
      } catch (e) {
        console.error('Failed to load tenant info', e)
      }
    }
    load()
  }, [user, loading, router])

  const unit = tenant?.current_unit

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-6 shadow-theme-lg">
          <div>
            <div className="text-sm opacity-80">Property</div>
            <div className="text-2xl font-bold">Property Information</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>{tenant?.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>{tenant?.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{tenant?.lease_status || 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4 text-brand-600" />
                Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span>{unit?.property?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span>{unit?.unit_number || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{unit?.unit_status || 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" />
                Key Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manager</span>
                <span>{unit?.property?.manager?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{unit?.property?.manager?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{unit?.property?.manager?.email || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}