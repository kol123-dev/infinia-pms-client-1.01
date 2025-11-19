'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCcw, Plus } from 'lucide-react'
import { useState } from 'react'

export function UsersToolbar(props: {
  search: string
  onSearchChange: (v: string) => void
  role: 'all' | 'agent' | 'tenant'
  onRoleChange: (v: 'all' | 'agent' | 'tenant') => void
  status: 'all' | 'active' | 'blocked' | 'pending'
  onStatusChange: (v: 'all' | 'active' | 'blocked' | 'pending') => void
  onCreateAgent: () => void
  selectedCount: number
  onRefresh: () => void
  refreshing?: boolean
}) {
  const [localSearch, setLocalSearch] = useState(props.search)
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Row: search + refresh + mobile actions */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Input
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            clearTimeout((window as any).__usersSearchTimer)
            ;(window as any).__usersSearchTimer = setTimeout(() => props.onSearchChange(e.target.value), 300)
          }}
          placeholder="Search name or email"
          className="w-full md:w-[320px]"
        />
        <Button variant="outline" onClick={props.onRefresh} title="Refresh" disabled={props.refreshing} aria-busy={props.refreshing}>
          <RefreshCcw className={`h-4 w-4 ${props.refreshing ? 'animate-spin' : ''}`} />
        </Button>

        {/* Mobile-only: Filters toggle */}
        <Button
          variant="outline"
          className="md:hidden"
          onClick={() => setFiltersOpen((v) => !v)}
          title="Filters"
        >
          {filtersOpen ? 'Hide Filters' : 'Filters'}
        </Button>

        {/* Mobile-only: New Agent inline */}
        <Button onClick={props.onCreateAgent} className="gap-2 md:hidden">
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      {/* Desktop filters + New Agent */}
      <div className="hidden md:flex items-center gap-2">
        <select
          value={props.role}
          onChange={(e) => props.onRoleChange(e.target.value as any)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All roles</option>
          <option value="agent">Agent</option>
          <option value="tenant">Tenant</option>
        </select>

        <select
          value={props.status}
          onChange={(e) => props.onStatusChange(e.target.value as any)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
        </select>

        <Button onClick={props.onCreateAgent} className="gap-2">
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      {/* Mobile filters panel */}
      {filtersOpen && (
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={props.role}
            onChange={(e) => props.onRoleChange(e.target.value as any)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="agent">Agent</option>
            <option value="tenant">Tenant</option>
          </select>

          <select
            value={props.status}
            onChange={(e) => props.onStatusChange(e.target.value as any)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      )}
    </div>
  )
}