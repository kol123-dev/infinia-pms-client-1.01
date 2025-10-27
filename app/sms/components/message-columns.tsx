import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { SmsMessage } from "../types"

const getStatusVariant = (status: SmsMessage['status']): "default" | "secondary" | "destructive" | "outline" => {
  const variants = {
    'delivered': 'default',
    'sent': 'secondary',
    'failed': 'destructive',
    'queued': 'outline'
  } as const
  return variants[status]
}

export const columns: ColumnDef<SmsMessage>[] = [
  {
    accessorKey: "recipient",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Recipient
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const msg = row.original as SmsMessage
      const tenantRecipients = (msg.recipients || [])
        .map(r => r.user?.full_name || r.user?.phone)
        .filter(Boolean)
      const manual = msg.manual_recipients || []
      const displayList = tenantRecipients.length ? tenantRecipients : manual
      const display = displayList.length > 0 ? displayList.join(", ") : "—"
      return display
    },
  },
  {
    accessorKey: "body",
    header: "Message",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as SmsMessage['status']
      return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
  },
  {
    accessorKey: "sent_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sent At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const msg = row.original as SmsMessage
      return msg.sent_at ? new Date(msg.sent_at).toLocaleString() : "—"
    },
  },
]