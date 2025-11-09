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
import { useRouter } from 'next/navigation';
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFabSheetOpen, setFabSheetOpen] = useState(false)

  // Remove page-level stats/loading states and fetching; the stats component handles its own data
  const [stats, setStats] = useState([
    { title: "Total Properties", value: "0", change: "Loading...", changeType: "positive", icon: Building, color: "text-brand-600" },
    { title: "Active Tenants", value: "0", change: "Loading...", changeType: "positive", icon: Users, color: "text-emerald-600" },
    { title: "Monthly Revenue", value: formatCurrency(0), change: "Loading...", changeType: "positive", icon: DollarSign, color: "text-green-600" },
    { title: "Vacant Units", value: "0", change: "Loading...", changeType: "warning", icon: AlertTriangle, color: "text-orange-600" },
  ]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();  // Moved to top level here (unconditionally)

  // Auth redirect useEffect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Data fetching useEffect
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session) return;

      setLoading(true);
      try {
        // Fetch properties with large page size and use count for total
        const propertiesRes = await axios.get('/properties/?page_size=9999');
        const totalProperties = propertiesRes.data.count;  // Use total count from pagination
        const propertiesChange = "+0 this month";  // TODO: Implement real change calculation if needed

        // Fetch tenants stats directly from the new endpoint
        const tenantsRes = await axios.get('/tenants/stats/');
        const activeTenants = tenantsRes.data.active_tenants?.count || 0;
        const tenantsChangePercentage = tenantsRes.data.active_tenants?.change_percentage || 0;
        const tenantsChange = `${tenantsChangePercentage > 0 ? '+' : ''}${tenantsChangePercentage.toFixed(2)}% from last month`;

        // Fetch revenue stats (now accessing nested fields)
        const revenueRes = await axios.get('/payments/stats/');
        const monthlyRevenue = revenueRes.data.total_collected?.amount || 0;
        const revenueChangePercentage = revenueRes.data.total_collected?.change_percentage || 0;
        const revenueChange = `${revenueChangePercentage > 0 ? '+' : ''}${revenueChangePercentage.toFixed(2)}% from last month`;

        const unitsRes = await axios.get('/units/stats/');
        const vacantUnits = unitsRes.data.vacant_units || 0;
        const unitsChange = "0 changes";  // TODO: Implement real change calculation if needed

        setStats([
          { title: "Total Properties", value: totalProperties.toString(), change: propertiesChange, changeType: "positive", icon: Building, color: "text-brand-600" },
          { title: "Active Tenants", value: activeTenants.toString(), change: tenantsChange, changeType: "positive", icon: Users, color: "text-emerald-600" },
          { title: "Monthly Revenue", value: formatCurrency(monthlyRevenue), change: revenueChange, changeType: revenueChangePercentage >= 0 ? "positive" : "negative", icon: DollarSign, color: "text-green-600" },
          { title: "Vacant Units", value: vacantUnits.toString(), change: unitsChange, changeType: "negative", icon: AlertTriangle, color: "text-red-600" },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
    }
  }, [session, toast]);

  // Let MainLayout handle auth loading (shows route-aware skeleton)
  if (status === 'loading') {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  // Show dashboard skeleton during data fetches instead of a spinner
  if (loading) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  // Keep only the unauthenticated guard
  if (!session) {
    return null;
  }

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
            <>
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card-enhanced w-full rounded-lg border bg-card">
                      <div className="flex items-center justify-between p-2">
                        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="p-2 pt-0">
                        <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 mt-1 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card-enhanced rounded-lg border bg-card">
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="px-4 pt-0 pb-4">
                      <div className="h-7 w-20 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-32 mt-2 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                  router.push(action.href)
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