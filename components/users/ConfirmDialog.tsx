'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ConfirmDialog(props: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  confirmText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        {props.description && <p className="text-sm text-muted-foreground">{props.description}</p>}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
          <Button
            variant={props.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => props.onConfirm()}
          >
            {props.confirmText ?? 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}