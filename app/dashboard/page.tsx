'use client';

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Building, Users, DollarSign, AlertTriangle, Plus, Eye, TrendingUp, MessageSquare } from "lucide-react"  // Added MessageSquare
import { DashboardCharts } from "@/components/dashboard/charts"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Badge } from "@/components/ui/badge"
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import axios from '@/lib/axios';
import { formatCurrency } from "@/lib/utils"
import { useToast } from '@/hooks/use-toast';  // Import for toast notifications
import { Tenant } from '../tenants/types';  // Import for Tenant type
import Link from 'next/link';

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // States for dynamic stats and loading
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
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>
          <Badge variant="outline" className="entity-badge w-fit self-start md:self-center">
            <span className="text-xs sm:text-sm">PropertyPro Management</span>
            <span className="badge-count text-xs">12</span>
          </Badge>
        </div>

       

        {/* Stats Grid - Mobile Optimized */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <Card key={stat.title} className="card-enhanced w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="text-lg font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp
                      className={`h-3 w-3 flex-shrink-0 ${stat.changeType === "positive" ? "text-green-600" : stat.changeType === "warning" ? "text-orange-600" : "text-red-600"}`}
                    />
                    <p
                      className={`text-xs whitespace-nowrap overflow-hidden text-ellipsis ${stat.changeType === "positive" ? "text-green-600" : stat.changeType === "warning" ? "text-orange-600" : "text-red-600"}`}
                    >
                      {stat.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Grid - Desktop */}
        <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="card-enhanced hover:shadow-theme-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp
                    className={`h-3 w-3 ${stat.changeType === "positive" ? "text-green-600" : stat.changeType === "warning" ? "text-orange-600" : "text-red-600"}`}
                  />
                  <p
                    className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : stat.changeType === "warning" ? "text-orange-600" : "text-red-600"}`}
                  >
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions - Mobile Optimized */}
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

        {/* Quick Actions - Desktop */}
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

        {/* Charts and Activity - Stacked on Mobile */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:gap-4 xl:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2 h-full">
            <DashboardCharts />
          </div>
          <div className="min-h-[300px]">
            <RecentActivity />
          </div>
        </div>

        {/* Occupancy Overview - Collapsible on Mobile */}
        <Card className="card-enhanced">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg font-semibold">Occupancy Overview</CardTitle>
            <CardDescription className="text-sm">Current occupancy rates across properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {[
              { name: "Sunset Apartments", entity: "Johnson Holdings", occupied: 24, total: 30, rate: 80 },
              { name: "Downtown Complex", entity: "Smith Properties", occupied: 18, total: 20, rate: 90 },
              { name: "Garden View", entity: "Direct Management", occupied: 12, total: 15, rate: 75 },
            ].map((property) => (
              <div key={property.name} className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">{property.name}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {property.entity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {property.occupied}/{property.total} units
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-semibold text-brand-600">{property.rate}%</div>
                  </div>
                </div>
                <Progress value={property.rate} className="h-2 bg-brand-100 dark:bg-brand-900" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Floating Action Button - Mobile Only */}
        <FloatingActionButton className="md:hidden">
          <Plus className="h-6 w-6" />
        </FloatingActionButton>
      </div>
    </MainLayout>
  )
}