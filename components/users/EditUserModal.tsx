'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUserQuery, useUpdateUser, usePermissionsCatalog, useUserPermissions, useUpdateUserPermissions, usePropertiesBrief } from '@/hooks/useUsers'
import { useEffect, useMemo, useState } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function EditUserModal(props: { userId: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: user } = useUserQuery(props.userId)
  const { data: catalog } = usePermissionsCatalog()
  const { data: userPerms } = useUserPermissions(props.userId)
  const { data: properties } = usePropertiesBrief()
  const { mutate: updateUser, isPending: updating } = useUpdateUser()
  const { mutate: updatePerms, isPending: savingPerms } = useUpdateUserPermissions()

  const [name, setName] = useState(user?.name ?? '')
  const [status, setStatus] = useState<'active' | 'blocked' | 'pending'>(user?.status ?? 'active')
  const [role, setRole] = useState<'agent' | 'tenant'>(user?.role ?? 'agent')
  const [perms, setPerms] = useState<string[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([])
  const [scoped, setScoped] = useState<Record<number, Record<string, Set<string>>>>({})

  useEffect(() => {
    setName(user?.name ?? '')
    setStatus(user?.status ?? 'active')
    setRole(user?.role ?? 'agent')
  }, [user])

  useEffect(() => {
    setPerms([])
    const initial: Record<number, Record<string, Set<string>>> = {}
    ;(userPerms?.scoped ?? []).forEach((entry: any) => {
      const pid = Number(entry.property_id)
      if (!initial[pid]) initial[pid] = {}
      const res = String(entry.resource)
      const acts: string[] = Array.isArray(entry.actions) ? entry.actions : (entry.action ? [entry.action] : [])
      if (!initial[pid][res]) initial[pid][res] = new Set<string>()
      acts.forEach((a) => initial[pid][res].add(String(a)))
    })
    setScoped(initial)
    setSelectedPropertyIds(Object.keys(initial).map((k) => Number(k)))
  }, [userPerms])

  const togglePerm = (_code: string, _checked: boolean) => {}

  const resources = catalog?.resources ?? []
  const resourceList = useMemo(() => resources.filter((r: any) => r.scopable), [resources])
  const toggleScoped = (pid: number, resource: string, action: string, checked: boolean) => {
    setScoped((prev) => {
      const next = { ...prev }
      next[pid] = next[pid] ? { ...next[pid] } : {}
      const set = next[pid][resource] ? new Set(next[pid][resource]) : new Set<string>()
      checked ? set.add(action) : set.delete(action)
      next[pid][resource] = set
      return next
    })
  }

  const onSaveProfile = () => {
    if (!user) return
    updateUser({ id: user.id, name, status, role }, { onSuccess: () => props.onOpenChange(false) })
  }

  const onSavePerms = () => {
    if (!user) return
    const scopedPayload = Object.entries(scoped).flatMap(([pidStr, resMap]) => {
      const pid = Number(pidStr)
      return Object.entries(resMap).map(([resource, actionsSet]) => ({ property_id: pid, resource, actions: Array.from(actionsSet) }))
    })
    updatePerms({ id: user.id, scoped: scopedPayload }, { onSuccess: () => props.onOpenChange(false) })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
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

            <TabsContent value="permissions" className="space-y-6 pt-4">
              <div className="space-y-4">
                <Label>Per Property</Label>
                <MultiSelect
                  options={(properties ?? []).map((p: any) => ({ value: p.id, label: p.name }))}
                  value={selectedPropertyIds}
                  onChange={setSelectedPropertyIds}
                  placeholder="Select properties"
                />

                {selectedPropertyIds.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Select one or more properties to assign scoped permissions.</div>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {selectedPropertyIds.map((pid) => {
                      const name = (properties ?? []).find((p: any) => p.id === pid)?.name || `Property #${pid}`
                      return (
                        <AccordionItem key={pid} value={`prop-${pid}`} className="rounded-lg border">
                          <AccordionTrigger className="px-4 py-2 text-sm font-semibold">{name}</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resourceList.map((r: any) => (
                                  <div key={r.resource} className="rounded-md border p-3">
                                    <div className="text-sm font-semibold mb-3 capitalize">{r.resource}</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      {r.actions.map((a: string) => (
                                        <label key={a} className="flex items-center gap-2 text-sm">
                                          <Checkbox
                                            checked={Boolean(scoped[pid]?.[r.resource]?.has(a))}
                                            onCheckedChange={(v) => toggleScoped(pid, r.resource, a, !!v)}
                                          />
                                          {a}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                )}
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
