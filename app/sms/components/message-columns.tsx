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
    accessorKey: "created_at",
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
  },
]