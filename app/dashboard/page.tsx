// Top-level imports in Dashboard page
'use client';

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Building, Users, DollarSign, AlertTriangle, Plus, Eye, TrendingUp, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import axios from '@/lib/axios';
import { formatCurrency } from "@/lib/utils"
import { useToast } from '@/hooks/use-toast';
import { Tenant } from '../tenants/types';
import Link from 'next/link';
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
// Add Suspense and the new stats component
import { Suspense } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";

const quickActions = [
  { label: "Add Tenant", shortLabel: "Tenant", icon: Plus, href: "/tenants", variant: "default" as const },
  { label: "Record Payment", shortLabel: "Payment", icon: DollarSign, href: "/payments", variant: "outline" as const },
  {
    label: "Send SMS",
    shortLabel: "SMS",
    icon: MessageSquare,
    href: "/sms",
    variant: "outline" as const,
  },
  { label: "View Reports", shortLabel: "Reports", icon: Eye, href: "/reports", variant: "outline" as const },
]

// Replace static imports of heavy components with dynamic imports
import dynamic from 'next/dynamic'
const DashboardCharts = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.DashboardCharts),
  {
    ssr: false,
    loading: () => <div className="h-[340px] md:h-[380px] lg:h-[420px] rounded-lg bg-muted animate-pulse" />
  }
)

const RecentActivity = dynamic(
  () => import('@/components/dashboard/recent-activity').then(m => m.RecentActivity),
  {
    ssr: false,
    loading: () => <div className="h-[300px] rounded-lg bg-muted animate-pulse" />
  }
)

export default function Dashboard() {
  const { data: session } = useSession();
  const [isFabSheetOpen, setFabSheetOpen] = useState(false)

  // Auth is handled by MainLayout or middleware in a real app, 
  // but we keep the hook for session access if needed.

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Header Section (always visible) */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Welcome back! Here's what's happening with your property.
            </p>
          </div>
          <Badge variant="outline" className="entity-badge w-fit self-start md:self-center">
            <span className="text-xs sm:text-sm">InfiniaSync Properties</span>
          </Badge>
        </div>

        {/* Stats - Suspense boundary with local fallback */}
        <Suspense
          fallback={
            <DashboardSkeleton />
          }
        >
          <DashboardStats />
        </Suspense>

        {/* Quick Actions - Mobile (always visible) */}
        <Card className="card-enhanced md:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant={action.variant}
                    className="h-16 flex-col gap-2 text-xs touch-target w-full"
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="hidden xs:inline">{action.label}</span>
                    <span className="xs:hidden">{action.shortLabel}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Desktop (always visible) */}
        <Card className="card-enhanced hidden md:block">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Frequently used actions for efficient management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant={action.variant}
                    className="justify-start h-12 text-sm shadow-theme hover:shadow-theme-lg transition-all w-full"
                  >
                    <action.icon className="mr-3 h-4 w-4" />
                    <span>{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity: dynamic import provides its own loading skeleton */}
        <div className="min-h-[300px]">
          <RecentActivity />
        </div>

        {/* Charts: dynamic import provides its own loading skeleton */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:gap-4 xl:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-2 xl:col-span-3 h-full">
            <DashboardCharts />
          </div>
        </div>

        {/* Floating Action Button - Mobile Only */}
        <FloatingActionButton className="md:hidden" onClick={() => setFabSheetOpen(true)}>
          <Plus className="h-6 w-6" />
        </FloatingActionButton>

        {/* Quick Actions Bottom Sheet (always available) */}
        <BottomSheet
          isOpen={isFabSheetOpen}
          onClose={() => setFabSheetOpen(false)}
          title="Quick Actions"
        >
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setFabSheetOpen(false)
                }}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </BottomSheet>
      </div>
    </MainLayout>
  )
}
// Removed:
// export const metadata = {
//   themeColor: '#0ea5e9',
// }
// export const viewport = {
//   themeColor: '#0ea5e9'
// }
