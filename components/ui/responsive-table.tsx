"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

interface ResponsiveTableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

interface ResponsiveTableCellProps {
  children: ReactNode
  label: string
  className?: string
  hideOnMobile?: boolean
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("responsive-table", className)}>
      <table className="w-full">{children}</table>
    </div>
  )
}

export function ResponsiveTableRow({ children, className, onClick }: ResponsiveTableRowProps) {
  return (
    <tr
      className={cn(
        "mobile-table-card md:table-row md:border-b md:border-border md:hover:bg-accent/50",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function ResponsiveTableCell({ children, label, className, hideOnMobile }: ResponsiveTableCellProps) {
  return (
    <td
      className={cn("block py-2 md:table-cell md:px-4 md:py-3", hideOnMobile && "hidden md:table-cell", className)}
      data-label={label}
    >
      <div className="flex items-center justify-between md:block">
        <span className="font-medium text-muted-foreground mr-2 md:hidden">{label}:</span>
        <div className="text-right md:text-left">{children}</div>
      </div>
    </td>
  )
}

export function ResponsiveTableHeader({ children }: { children: ReactNode }) {
  return <thead className="hidden md:table-header-group">{children}</thead>
}

export function ResponsiveTableBody({ children }: { children: ReactNode }) {
  return <tbody className="block md:table-row-group">{children}</tbody>
}
