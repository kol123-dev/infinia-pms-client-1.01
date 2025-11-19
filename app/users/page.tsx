'use client'
import { useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersToolbar } from '@/components/users/UsersToolbar'
import UsersTable from '@/components/users/UsersTable'
import { CreateAgentModal } from '@/components/users/CreateAgentModal'
import { EditUserModal } from '@/components/users/EditUserModal'
import { useUsersQuery } from '@/hooks/useUsers'
import { useSession } from 'next-auth/react'

export default function UsersPage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'agent' | 'tenant'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'pending'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editUserId, setEditUserId] = useState<number | null>(null)

  const [tab, setTab] = useState<'staff' | 'tenants'>('tenants')

  const computedRole = useMemo(() => {
    if (roleFilter !== 'all') return roleFilter
    return tab === 'staff' ? 'agent' : 'tenant'
  }, [roleFilter, tab])

  const { data, isLoading, isError, isFetching, refetch } = useUsersQuery({
    q: search,
    role: computedRole,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    pageSize,
  })

  const openEdit = (id: number) => setEditUserId(id)
  const closeEdit = () => setEditUserId(null)

  const sortedUsers = useMemo(() => {
    const list = data?.results ?? []
    return [...list].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })
  }, [data])

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="shadow-theme">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Users</span>
              <span className="text-sm font-normal text-muted-foreground">
                {isLoading ? 'Loading…' : `${data?.count ?? 0} total`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sticky controls on mobile: tabs + toolbar */}
            <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b md:static md:border-0 md:bg-transparent md:backdrop-blur-0">
              {/* Staff / Tenants tab */}
              <div className="flex items-center gap-2 pb-3 md:pb-0">
                <button
                  className={`px-3 py-2 rounded text-sm flex-1 md:flex-none ${tab === 'staff' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setTab('staff')}
                  aria-pressed={tab === 'staff'}
                >
                  Staff
                </button>
                <button
                  className={`px-3 py-2 rounded text-sm flex-1 md:flex-none ${tab === 'tenants' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setTab('tenants')}
                  aria-pressed={tab === 'tenants'}
                >
                  Tenants
                </button>
              </div>

              <UsersToolbar
                search={search}
                onSearchChange={setSearch}
                role={roleFilter}
                onRoleChange={setRoleFilter}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                onCreateAgent={() => setCreateOpen(true)}
                selectedCount={selectedIds.length}
                onRefresh={() => { setPage(1); refetch() }}
                refreshing={isFetching}
              />
            </div>

            <UsersTable
              users={sortedUsers}
              loading={isLoading}
              error={isError}
              page={page}
              pageSize={pageSize}
              total={data?.count ?? 0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onEdit={openEdit}
            />
          </CardContent>
        </Card>

        <CreateAgentModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            setTab('staff')
            setRoleFilter('agent')
            setPage(1)
            refetch()
          }}
        />

        {editUserId !== null && (
          <EditUserModal
            userId={editUserId}
            open={editUserId !== null}
            onOpenChange={(open) => !open && closeEdit()}
          />
        )}
      </div>
    </MainLayout>
  )
}