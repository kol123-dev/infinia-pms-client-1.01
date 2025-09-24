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
import { fuzzyFilter } from './data-table'

export const columns: ColumnDef<Unit>[] = [
  {
    accessorKey: 'unit_number',
    header: 'Unit No.',
    filterFn: fuzzyFilter,
    enableGlobalFilter: true,
    cell: ({ row }) => <div>{row.original.unit_number}</div>,
  },
  {
    accessorFn: (row) => row.property?.name ?? '',
    id: 'property',
    header: 'Property',
    filterFn: fuzzyFilter,
    enableGlobalFilter: true,
    cell: ({ row }) => <div className="truncate">{row.original.property.name}</div>,
  },
  {
    accessorFn: (row) => row.current_tenant?.user?.full_name ?? '', // Enables fuzzy filtering on tenant full name
    id: 'current_tenant',
    header: 'Tenant',
    filterFn: fuzzyFilter,
    enableGlobalFilter: true,
    size: 150,
    cell: ({ row }) => {
      const tenant = row.original.current_tenant
      return tenant ? (
        <div className="truncate">
          <div className="font-medium truncate">{tenant.user.full_name}</div>
          <div className="text-sm text-muted-foreground truncate">{tenant.user.phone}</div>
        </div>
      ) : (
        <div className="text-muted-foreground">None</div> // Updated from "-" for consistency with your original
      )
    },
  },
  {
    accessorKey: "unit_status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    filterFn: fuzzyFilter,
    enableGlobalFilter: true,
    cell: ({ row }) => {
      const status = row.getValue("unit_status");
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
      );
    },
  },
  {
    accessorKey: "rent",
    header: "Rent",
    size: 100,
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const amount = row.getValue("rent") as number
      return <div className="font-medium">KES {formatCurrency(amount)}</div>
    },
  },
  {
    accessorKey: "deposit",
    header: "Deposit",
    size: 100,
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const amount = row.getValue("deposit") as number
      return <div className="font-medium">KES {formatCurrency(amount)}</div>
    },
  },
  {
    accessorKey: "lease_end_date",
    header: "Lease Ends",
    size: 100,
    enableGlobalFilter: false,
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
  {
    accessorKey: 'unit_type',
    header: 'Type',
    enableGlobalFilter: false,
  },
]