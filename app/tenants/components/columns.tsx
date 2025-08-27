import { ColumnDef, TableMeta } from "@tanstack/react-table"
import { Tenant } from "../types" // Adjust if path differs
import { Button } from "@/components/ui/button"
import { MessageSquare, Eye, Edit, Trash, LogOut ,ArrowUpDown} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface CustomTableMeta extends TableMeta<Tenant> {
  onMessage?: (tenant: Tenant) => void
  onView?: (tenant: Tenant) => void
}

export const columns: ColumnDef<Tenant>[] = [
  {
    accessorKey: "user",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20"
        >
          Tenant
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tenant = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{tenant.user?.full_name?.[0] || "T"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{tenant.user?.full_name}</span>
            <span className="text-sm text-muted-foreground">{tenant.phone || tenant.user?.phone || "No phone"}</span>
          </div>
        </div>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "current_unit",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20"
        >
          Property
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tenant = row.original
      return (
        <div className="flex flex-col">
          <span>{tenant.current_unit?.property?.name || "Not Assigned"}</span>
          <span className="text-green-500 text-sm">
            Unit {tenant.current_unit?.unit_number}
          </span>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "tenant_status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/10 dark:hover:bg-purple-900/20"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("tenant_status") as string
      return (
        <Badge
          variant={status === "ACTIVE" ? "default" : status === "PAST" ? "secondary" : "destructive"}
        >
          {status.toLowerCase()}
        </Badge>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "current_unit.rent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20"
        >
          Rent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const unit = row.original.current_unit
      const amount = unit ? unit.rent : 0
      return <div className="font-medium">{formatCurrency(amount)}</div>
    },
    enableSorting: true,
  },
  {
    accessorKey: "balance_due",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20"
        >
          Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balance_due")) || 0
      return <div className="font-medium">{formatCurrency(amount)}</div>
    },
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta?.onMessage?.(row.original)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta?.onView?.(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]