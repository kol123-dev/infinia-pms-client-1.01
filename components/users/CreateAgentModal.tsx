'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useCreateAgent, usePermissionsCatalog } from '@/hooks/useUsers'
import { Checkbox } from '@/components/ui/checkbox'

export function CreateAgentModal(props: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const { data: catalog } = usePermissionsCatalog()
  const { mutate: createAgent, isPending: creating } = useCreateAgent()

  const togglePerm = (code: string, checked: boolean) => {
    const set = new Set(selectedPerms)
    checked ? set.add(code) : set.delete(code)
    setSelectedPerms(Array.from(set))
  }

  const onSubmit = () => {
    createAgent(
      { email, name, permissions: selectedPerms },
      {
        onSuccess: () => {
          setEmail('')
          setName('')
          setSelectedPerms([])
          props.onCreated?.()
          props.onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3">
            <Label>Email</Label>
            <Input
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label>Name (optional)</Label>
            <Input
              placeholder="Agent Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(catalog?.permissions ?? []).map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedPerms.includes(p)}
                    onCheckedChange={(v) => togglePerm(p, !!v)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={creating}>Cancel</Button>
            <Button onClick={onSubmit} disabled={creating || !email}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}