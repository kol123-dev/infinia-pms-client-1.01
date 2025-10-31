'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User, FileText } from 'lucide-react'
import { useUser } from '@/lib/context/user-context'

export default function TenantProfilePage() {
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
            <div className="text-sm opacity-80">Account</div>
            <div className="text-2xl font-bold">Profile & Documents</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and update your personal details.
              </p>
              <Link href="/profile">
                <Button>Go to Profile</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload and manage lease and personal documents.
              </p>
              <Link href="/profile">
                <Button variant="outline">Manage Documents</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}