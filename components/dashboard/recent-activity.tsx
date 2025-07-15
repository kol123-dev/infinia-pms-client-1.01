import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

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
                    {activity.type === "payment" && "💰"}
                    {activity.type === "maintenance" && "🔧"}
                    {activity.type === "lease" && "📄"}
                    {activity.type === "inspection" && "🔍"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{activity.description}</p>
                  {activity.amount && <p className="text-sm text-green-600 font-medium">{activity.amount}</p>}
                  {activity.property && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{activity.property}</p>
                  )}
                  {activity.tenant && <p className="text-xs sm:text-sm text-muted-foreground">{activity.tenant}</p>}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <Badge
                      variant={
                        activity.status === "completed"
                          ? "default"
                          : activity.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs h-5"
                    >
                      {activity.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 h-5 truncate max-w-[120px]"
                    >
                      {activity.entity}
                    </Badge>
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
