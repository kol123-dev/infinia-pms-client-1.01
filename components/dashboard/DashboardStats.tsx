'use client'

import { useSession } from 'next-auth/react'
import axios from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'
import { Building, Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

export default function DashboardStats() {
  const { data: session } = useSession()

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [propertiesRes, tenantsRes, revenueRes, unitsRes] = await Promise.all([
        axios.get('/properties/stats/'),
        axios.get('/tenants/stats/'),
        axios.get('/payments/stats/'),
        axios.get('/units/stats/'),
      ])

      return {
        properties: propertiesRes.data,
        tenants: tenantsRes.data,
        revenue: revenueRes.data,
        units: unitsRes.data,
      }
    },
    enabled: !!session,
    staleTime: 60000, // Cache for 1 minute
  })

  // Parse Data
  const totalProperties = statsData?.properties?.count || 0
  const propertiesChange = "+0 this month"

  const activeTenants = statsData?.tenants?.active_tenants?.count || 0
  const tenantsChangePercentage = statsData?.tenants?.active_tenants?.change_percentage || 0
  const tenantsChange = `${tenantsChangePercentage > 0 ? '+' : ''}${tenantsChangePercentage.toFixed(2)}% from last month`

  const monthlyRevenue = statsData?.revenue?.total_collected?.amount || 0
  const revenueChangePercentage = statsData?.revenue?.total_collected?.change_percentage || 0
  const revenueChange = `${revenueChangePercentage > 0 ? '+' : ''}${revenueChangePercentage.toFixed(2)}% from last month`

  const vacantUnits = statsData?.units?.vacant_units || 0
  const unitsChange = '0 changes'

  const stats = [
    { title: 'Total Properties', value: totalProperties.toString(), change: propertiesChange, changeType: 'positive', icon: Building, color: 'text-brand-600', href: '/properties' },
    { title: 'Active Tenants', value: activeTenants.toString(), change: tenantsChange, changeType: 'positive', icon: Users, color: 'text-emerald-600', href: '/tenants' },
    { title: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), change: revenueChange, changeType: revenueChangePercentage >= 0 ? 'positive' : 'negative', icon: DollarSign, color: 'text-green-600', href: '/payments' },
    { title: 'Vacant Units', value: vacantUnits.toString(), change: unitsChange, changeType: 'negative', icon: AlertTriangle, color: 'text-red-600', href: '/units' },
  ]

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href} aria-label={`Go to ${stat.title}`} className="block">
              <div className="card-enhanced w-full rounded-lg border bg-card hover:shadow-theme-lg transition-shadow">
                <div className="flex flex-row items-center justify-between p-2">
                  <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                  <div className="p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="p-2 pt-0">
                  {isLoading ? (
                    <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                  ) : (
                    <div className="text-lg font-bold text-foreground">{stat.value}</div>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {isLoading ? (
                      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    ) : (
                      <>
                        <TrendingUp
                          className={`h-3 w-3 flex-shrink-0 ${stat.changeType === 'positive'
                              ? 'text-green-600'
                              : stat.changeType === 'warning'
                                ? 'text-orange-600'
                                : 'text-red-600'
                            }`}
                        />
                        <p
                          className={`text-xs whitespace-nowrap overflow-hidden text-ellipsis ${stat.changeType === 'positive'
                              ? 'text-green-600'
                              : stat.changeType === 'warning'
                                ? 'text-orange-600'
                                : 'text-red-600'
                            }`}
                        >
                          {stat.change}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} aria-label={`Go to ${stat.title}`} className="block">
            <div className="card-enhanced rounded-lg border bg-card hover:shadow-theme-lg transition-shadow">
              <div className="flex flex-row items-center justify-between p-4 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="px-4 pt-0 pb-4">
                {isLoading ? (
                  <div className="h-6 w-16 rounded bg-muted animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {isLoading ? (
                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                  ) : (
                    <>
                      <TrendingUp
                        className={`h-3 w-3 ${stat.changeType === 'positive'
                            ? 'text-green-600'
                            : stat.changeType === 'warning'
                              ? 'text-orange-600'
                              : 'text-red-600'
                          }`}
                      />
                      <p
                        className={`text-xs ${stat.changeType === 'positive'
                            ? 'text-green-600'
                            : stat.changeType === 'warning'
                              ? 'text-orange-600'
                              : 'text-red-600'
                          }`}
                      >
                        {stat.change}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}