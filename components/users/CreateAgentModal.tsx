'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useCreateAgent } from '@/hooks/useUsers'


export function CreateAgentModal(props: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const { mutate: createAgent, isPending: creating } = useCreateAgent()



  const onSubmit = () => {
    createAgent(
      { email, name },
      {
        onSuccess: () => {
          setEmail('')
          setName('')
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



          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={creating}>Cancel</Button>
            <Button onClick={onSubmit} disabled={creating || !email}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}