'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useUser } from '@/lib/context/user-context'
import { Wrench, List } from 'lucide-react'

export default function TenantMaintenancePage() {
  const router = useRouter()
  const { user, loading } = useUser()

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
  }, [user, loading, router])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-6 shadow-theme-lg">
          <div>
            <div className="text-sm opacity-80">Support</div>
            <div className="text-2xl font-bold">Maintenance & Repairs</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-brand-600" />
                Submit Maintenance Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Describe the issue and attach photos if needed.
              </p>
              <Link href="/help">
                <Button>Start Request</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-4 w-4 text-brand-600" />
                My Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Coming soon: ticket history and status.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}