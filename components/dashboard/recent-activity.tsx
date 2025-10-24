import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import axios from "@/lib/axios"

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
      type: "payment"
      description: string
      amount: string
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

          const timeAgo = (dateStr?: string | null) => {
            if (!dateStr) return ''
            const d = new Date(dateStr)
            const diffMs = Date.now() - d.getTime()
            const mins = Math.floor(diffMs / 60000)
            if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
            const hours = Math.floor(mins / 60)
            if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
            const days = Math.floor(hours / 24)
            return `${days} day${days === 1 ? '' : 's'} ago`
          }

          const mapped = results
            .filter((p: any) => String(p?.payment_status || p?.status).toUpperCase() === 'PAID')
            .map((p: any) => {
              const tenantName = p?.tenant?.user?.full_name || null
              const payerFallback =
                p?.mpesa_details?.first_name || p?.cash_details?.tenant_name || p?.bank_details?.tenant_name || null
              const description = `Payment received from ${tenantName || payerFallback || 'Unknown'}`
              const amountStr = fmtAmount(Number(p?.amount || 0))
              const propertyName = p?.property?.name || 'Unknown Property'
              const unitNumber = p?.unit?.unit_number || p?.account_reference || null
              return {
                id: p?.payment_id || p?.id,
                type: "payment" as const,
                description,
                amount: amountStr,
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
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs">
                      {"💰"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{activity.description}</p>
                    {activity.amount && <p className="text-sm text-green-600 font-medium">{activity.amount}</p>}
                    {/* Property name badge */}
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                        <Badge variant="default" className="text-xs h-5">completed</Badge>
                        <Badge
                          variant="outline"
                          className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 h-5 truncate max-w-[120px]"
                        >
                          {activity.entity}
                        </Badge>
                      </div>
                      {/* Unit number directly below the property name */}
                      {activity.unit_number && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Unit {activity.unit_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
}
