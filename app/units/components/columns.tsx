import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Unit } from "../types"
import { formatCurrency } from "@/lib/utils"

export const columns: ColumnDef<Unit>[] = [
  {
    accessorKey: "unit_number",
    header: "Unit No.",
    size: 80,
  },
  {
    accessorKey: "property",
    header: "Property",
    size: 120,
    cell: ({ row }) => {
      const property = row.original.property
      return <div className="truncate">{property.name}</div>
    },
  },
  {
    accessorKey: "unit_type",
    header: "Type",
    size: 100,
  },
  {
    accessorKey: "size",
    header: "Size",
    size: 80,
    cell: ({ row }) => {
      return <div>{row.original.size} m²</div>
    },
  },
  {
    accessorKey: "unit_status",
    header: "Status",
    size: 100,
    cell: ({ row }) => {
      const status = row.getValue("unit_status")
      return (
        <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
          ${status === "VACANT" ? "bg-red-100 text-red-800" : 
            status === "OCCUPIED" ? "bg-green-100 text-green-800" : 
            "bg-yellow-100 text-yellow-800"}`}
        >
          {status === "VACANT" ? "Vacant" : 
           status === "OCCUPIED" ? "Occupied" : 
           "Maintenance"}
        </div>
      )
    },
  },
  {
    accessorKey: "rent",
    header: "Rent",
    size: 100,
    cell: ({ row }) => {
      const amount = row.getValue("rent") as number
      return <div className="font-medium">{formatCurrency(amount)}</div>
    },
  },
  {
    accessorKey: "deposit",
    header: "Deposit",
    size: 100,
    cell: ({ row }) => {
      const amount = row.getValue("deposit") as number
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "current_tenant",
    header: "Tenant",
    size: 150,
    cell: ({ row }) => {
      const tenant = row.original.current_tenant
      return tenant ? (
        <div className="truncate">
          <div className="font-medium truncate">{tenant.user.full_name}</div>
          <div className="text-sm text-muted-foreground truncate">{tenant.user.phone}</div>
        </div>
      ) : (
        <div className="text-muted-foreground">-</div>
      )
    },
  },
  {
    accessorKey: "lease_end_date",
    header: "Lease Ends",
    size: 100,
    cell: ({ row }) => {
      const date = row.original.lease_end_date
      return date ? (
        <div className="whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </div>
      ) : (
        <div className="text-muted-foreground">-</div>
      )
    },
  },
]