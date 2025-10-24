import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import Link from "next/link"

const activities = [
  {
    id: 1,
    type: "payment",
    description: "Payment received from John Doe",
    amount: "$1,200",
    time: "2 hours ago",
    status: "completed",
    entity: "Sunset Apartments",
  },
  {
    id: 2,
    type: "maintenance",
    description: "Maintenance request submitted",
    property: "Unit 4B, Sunset Apartments",
    time: "4 hours ago",
    status: "pending",
    entity: "Johnson Holdings",
  },
  {
    id: 3,
    type: "lease",
    description: "New lease agreement signed",
    tenant: "Sarah Wilson",
    time: "1 day ago",
    status: "completed",
    entity: "Downtown Complex",
  },
  {
    id: 4,
    type: "inspection",
    description: "Move-out inspection scheduled",
    property: "Unit 2A, Downtown Complex",
    time: "2 days ago",
    status: "scheduled",
    entity: "Smith Properties",
  },
]

export function RecentActivity() {
    const [activities, setActivities] = useState<Array<{
      id: string | number
      payment_pk?: number
      type: "payment"
      description: string
      amount: string
      balance_after?: string
      time: string
      status: "completed"
      entity: string
      unit_number?: string | null
    }>>([])

    useEffect(() => {
      const loadRecentPayments = async () => {
        try {
          const res = await axios.get('/payments/payments/?page_size=10')
          const data = res.data
          const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []

          const fmtAmount = (n: number) =>
            new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

          const timeAgo = (iso: string | undefined) => {
            if (!iso) return 'Unknown time'
            const d = new Date(iso)
            const diffMs = Date.now() - d.getTime()
            const diffMin = Math.floor(diffMs / 60000)
            if (diffMin < 60) return `${diffMin} min ago`
            const diffHr = Math.floor(diffMin / 60)
            if (diffHr < 24) return `${diffHr} hrs ago`
            const diffDay = Math.floor(diffHr / 24)
            return `${diffDay} days ago`
          }

          const mapped = results
            .filter((p: any) => String(p?.payment_status || p?.status).toUpperCase() === 'PAID')
            .map((p: any) => {
              const tenantName = p?.tenant?.user?.full_name || null
              const payerFallback =
                p?.mpesa_details?.first_name || p?.cash_details?.tenant_name || p?.bank_details?.tenant_name || null
              const description = `Payment received from ${tenantName || payerFallback || 'Unknown'}`
              const amountStr = fmtAmount(Number(p?.amount || 0))
              const balanceStr = fmtAmount(Number(p?.balance_after || 0))
              const propertyName = p?.property?.name || 'Unknown Property'
              const unitNumber = p?.unit?.unit_number || p?.account_reference || null
              return {
                id: p?.payment_id || p?.id,
                payment_pk: p?.id, // numeric PK for routing
                type: "payment" as const,
                description,
                amount: amountStr,
                balance_after: balanceStr,
                time: timeAgo(p?.paid_date),
                status: "completed" as const,
                entity: propertyName,
                unit_number: unitNumber,
              }
            })

          setActivities(mapped)
        } catch (err) {
          console.error('Failed to load recent payments for activity:', err)
          setActivities([])
        }
      }

      loadRecentPayments()
    }, [])

    return (
      <Card className="card-enhanced">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-sm">Latest updates and notifications across all entities</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <ScrollArea className="h-[300px] sm:h-[400px] px-4 sm:px-0">
            <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-0">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="md:grid md:grid-cols-[auto_minmax(0,1fr)_minmax(240px,auto)_auto_auto] items-center gap-x-4 md:gap-x-6 lg:gap-x-8 p-3 rounded-lg hover:bg-accent/50 transition-colors border-b last:border-b-0"
                >
                  {/* Avatar */}
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs">
                      {"💰"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Description (clickable) */}
                  <Link
                    href={`/payments/${activity.payment_pk}`}
                    className="text-sm font-medium leading-tight hover:underline truncate"
                  >
                    {activity.description}
                  </Link>

                  {/* Amount + balance (aligned, non-wrapping) */}
                  {activity.amount && (
                    <div className="md:col-span-1 flex items-center md:justify-end gap-3 whitespace-nowrap tabular-nums">
                      <span className="text-sm font-semibold text-green-600 md:text-right">
                        {activity.amount}
                      </span>
                      {activity.balance_after && (
                        <span className="text-sm font-semibold text-red-600 md:text-right">
                          balance: {activity.balance_after}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Property + unit (desktop) */}
                  <div className="hidden md:flex items-center gap-3 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 h-5 truncate max-w-[200px]"
                    >
                      {activity.entity}
                    </Badge>
                    {activity.unit_number && (
                      <span className="text-xs text-muted-foreground">
                        • Unit {activity.unit_number}
                      </span>
                    )}
                  </div>

                  {/* Time + status (desktop, non-wrapping) */}
                  <div className="hidden md:flex items-center justify-end gap-3 whitespace-nowrap">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <Badge variant="default" className="text-xs h-5">completed</Badge>
                  </div>

                  {/* Mobile meta row (unchanged) */}
                  <div className="flex items-center gap-1 sm:gap-2 md:hidden mt-1">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <Badge variant="default" className="text-xs h-5">completed</Badge>
                    <Badge
                      variant="outline"
                      className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 h-5 truncate max-w-[140px]"
                    >
                      {activity.entity}
                    </Badge>
                    {activity.unit_number && (
                      <span className="text-xs text-muted-foreground">
                        • Unit {activity.unit_number}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
}
