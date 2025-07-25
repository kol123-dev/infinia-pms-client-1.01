import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Clock } from 'lucide-react'
import { CustomDataTable } from "./custom-data-table"
import { SmsMessage } from "../types"
import { columns } from "../components/message-columns"

interface MessageHistoryProps {
  messages?: { count: number; results: SmsMessage[] }
  onMessageSelect: (message: SmsMessage) => void
}

export function MessageHistory({ messages, onMessageSelect }: MessageHistoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Message History</CardTitle>
          <CardDescription>View all sent messages</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {messages?.count || 0} Recipients
          </Badge>
          <Badge variant="secondary" className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-1" />
            {messages?.results.length || 0} Messages
          </Badge>
          <Badge variant="secondary" className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Last 30 days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CustomDataTable
          columns={columns}
          data={messages?.results || []}
          onRowClick={(message) => onMessageSelect(message.original)}
        />
      </CardContent>
    </Card>
  )
}