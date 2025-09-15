import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Clock } from 'lucide-react'
import { CustomDataTable } from "./custom-data-table"
import { SmsMessage } from "../types"
import { columns } from "./message-columns"

interface MessageHistoryProps {
  messages?: { count: number; results: SmsMessage[] }
  onMessageSelect: (message: SmsMessage) => void
}

export function MessageHistory({ messages, onMessageSelect }: MessageHistoryProps) {
  return (
    <CustomDataTable
      columns={columns}
      data={messages?.results || []}
      onRowClick={(message) => onMessageSelect(message.original)}
    />
  )
}