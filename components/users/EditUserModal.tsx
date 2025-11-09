'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUserQuery, useUpdateUser, usePermissionsCatalog, useUserPermissions, useUpdateUserPermissions } from '@/hooks/useUsers'
import { useEffect, useState } from 'react'

export function EditUserModal(props: { userId: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: user } = useUserQuery(props.userId)
  const { data: catalog } = usePermissionsCatalog()
  const { data: userPerms } = useUserPermissions(props.userId)
  const { mutate: updateUser, isPending: updating } = useUpdateUser()
  const { mutate: updatePerms, isPending: savingPerms } = useUpdateUserPermissions()

  const [name, setName] = useState(user?.name ?? '')
  const [status, setStatus] = useState<'active' | 'blocked' | 'pending'>(user?.status ?? 'active')
  const [role, setRole] = useState<'agent' | 'tenant'>(user?.role ?? 'agent')
  const [perms, setPerms] = useState<string[]>(userPerms ?? [])

  useEffect(() => {
    setName(user?.name ?? '')
    setStatus(user?.status ?? 'active')
    setRole(user?.role ?? 'agent')
  }, [user])

  useEffect(() => {
    setPerms(userPerms ?? [])
  }, [userPerms])

  const togglePerm = (code: string, checked: boolean) => {
    const set = new Set(perms)
    checked ? set.add(code) : set.delete(code)
    setPerms(Array.from(set))
  }

  const onSaveProfile = () => {
    if (!user) return
    updateUser({ id: user.id, name, status, role }, { onSuccess: () => props.onOpenChange(false) })
  }

  const onSavePerms = () => {
    if (!user) return
    updatePerms({ id: user.id, permissions: perms }, { onSuccess: () => props.onOpenChange(false) })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        {!user ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              {user.role === 'agent' && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
            </TabsList>

            <TabsContent value="profile" className="space-y-4 pt-4">
              <div className="grid gap-3">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="grid gap-3">
                <Label>Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>

              <div className="grid gap-3">
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={updating}>Cancel</Button>
                <Button onClick={onSaveProfile} disabled={updating}>Save</Button>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(catalog?.permissions ?? []).map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={perms.includes(p)}
                      onCheckedChange={(v) => togglePerm(p, !!v)}
                    />
                    {p}
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={savingPerms}>Cancel</Button>
                <Button onClick={onSavePerms} disabled={savingPerms}>Save</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}