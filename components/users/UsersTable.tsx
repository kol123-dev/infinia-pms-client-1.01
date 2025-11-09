'use client'

import * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { useBlockUser, useDeleteUser } from '@/hooks/useUsers'
import { ConfirmDialog } from './ConfirmDialog'

type UserRow = {
  id: number
  name: string
  email: string
  role: 'agent' | 'tenant'
  status: 'active' | 'blocked' | 'pending'
  permissions?: string[]
  created_at: string
  last_active_at?: string | null
}

export default function UsersTable(props: {
  users: UserRow[]
  loading: boolean
  error: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (n: number) => void
  onPageSizeChange: (n: number) => void
  selectedIds: number[]
  onSelectedIdsChange: (ids: number[]) => void
  onEdit: (id: number) => void
}) {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null)
  const [confirmBlockId, setConfirmBlockId] = React.useState<number | null>(null)
  const { mutate: blockUser, isPending: blocking } = useBlockUser()
  const { mutate: deleteUser, isPending: deleting } = useDeleteUser()

  const allSelected = props.selectedIds.length === props.users.length && props.users.length > 0
  const findUser = React.useCallback((id: number) => props.users.find(u => u.id === id), [props.users])

  const toggleSelectAll = (checked: boolean) => {
    if (checked) props.onSelectedIdsChange(props.users.map(u => u.id))
    else props.onSelectedIdsChange([])
  }

  return (
    <div className="space-y-3">
      {/* Mobile list (cards) */}
      <div className="md:hidden space-y-3">
        {/* Select all + loading/empty states */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={allSelected} onCheckedChange={(v) => toggleSelectAll(!!v)} />
            Select all
          </label>
          {props.loading && <span className="text-sm text-muted-foreground">Loading…</span>}
        </div>

        {!props.loading && props.users.length === 0 && (
          <div className="rounded-md border p-4 text-center text-muted-foreground">
            No users yet. Create your first agent.
          </div>
        )}

        {!props.loading && props.users.map((u) => (
          <div key={u.id} className="rounded-md border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={props.selectedIds.includes(u.id)}
                  onCheckedChange={(v) => {
                    const set = new Set(props.selectedIds)
                    v ? set.add(u.id) : set.delete(u.id)
                    props.onSelectedIdsChange(Array.from(set))
                  }}
                />
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => props.onEdit(u.id)}>Edit</Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{u.role}</Badge>
              <Badge className={u.status === 'active' ? 'bg-blue-600 text-blue-50' : u.status === 'blocked' ? 'bg-gray-600 text-gray-50' : 'bg-yellow-600 text-yellow-50'}>
                {u.status}
              </Badge>
              {u.permissions?.length ? (
                <span className="text-xs text-muted-foreground">
                  {u.permissions.length} permission{u.permissions.length > 1 ? 's' : ''}
                </span>
              ) : null}
              {u.last_active_at && (
                <span className="text-xs text-muted-foreground">
                  Last active {formatDistanceToNow(new Date(u.last_active_at))} ago
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmBlockId(u.id)}
                disabled={blocking}
              >
                {u.status === 'active' ? 'Block' : 'Unblock'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteId(u.id)}
                disabled={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleSelectAll(!!v)} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Permissions</TableHead>
              <TableHead className="hidden md:table-cell">Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Loading users…
                </TableCell>
              </TableRow>
            )}

            {!props.loading && props.users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No users yet. Create your first agent.
                </TableCell>
              </TableRow>
            )}

            {props.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Checkbox
                    checked={props.selectedIds.includes(u.id)}
                    onCheckedChange={(v) => {
                      const set = new Set(props.selectedIds)
                      v ? set.add(u.id) : set.delete(u.id)
                      props.onSelectedIdsChange(Array.from(set))
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                <TableCell>
                  <Badge className={u.status === 'active' ? 'bg-blue-600 text-blue-50' : u.status === 'blocked' ? 'bg-gray-600 text-gray-50' : 'bg-yellow-600 text-yellow-50'}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {u.permissions?.length ? `${u.permissions.length} permission${u.permissions.length > 1 ? 's' : ''}` : '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {u.last_active_at ? `${formatDistanceToNow(new Date(u.last_active_at))} ago` : '—'}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => props.onEdit(u.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmBlockId(u.id)}
                    disabled={blocking}
                  >
                    {u.status === 'active' ? 'Block' : 'Unblock'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteId(u.id)}
                    disabled={deleting}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmBlockId !== null}
        onOpenChange={(o) => !o && setConfirmBlockId(null)}
        title={
          findUser(confirmBlockId ?? -1)?.status === 'active'
            ? 'Block user?'
            : 'Unblock user?'
        }
        description={`Are you sure you want to ${
          findUser(confirmBlockId ?? -1)?.status === 'active' ? 'block' : 'unblock'
        } ${findUser(confirmBlockId ?? -1)?.name ?? 'this user'}?`}
        confirmText={
          findUser(confirmBlockId ?? -1)?.status === 'active' ? 'Block' : 'Unblock'
        }
        onConfirm={() => {
          const id = confirmBlockId
          if (id !== null) {
            const u = findUser(id)
            const action = u?.status === 'active' ? 'block' : 'unblock'
            blockUser({ id, action })
          }
          setConfirmBlockId(null)
        }}
      />
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="Delete user?"
        description={`This will permanently delete ${
          findUser(confirmDeleteId ?? -1)?.name ?? 'this user'
        }.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          const id = confirmDeleteId
          if (id !== null) {
            deleteUser({ id })
          }
          setConfirmDeleteId(null)
        }}
      />
    </div>
  )
}