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
      getRowClassName={(row) => {
        const m = row.original as SmsMessage
        const isPartial = m.status === 'sent' && !!m.error_message
        return isPartial ? "bg-amber-900/20" : ""  // subtle highlight for partial sends
      }}
    />
  )
}