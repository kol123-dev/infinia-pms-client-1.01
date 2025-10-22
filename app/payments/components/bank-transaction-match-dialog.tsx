import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import api from '@/lib/axios'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  onSuccess: () => void
}

export function BankTransactionMatchDialog({ isOpen, onClose, transactionId, onSuccess }: Props) {
  const [unitNumber, setUnitNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleMatch = async () => {
    if (!unitNumber.trim()) {
      toast({ title: 'Error', description: 'Please enter a unit number', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await api.post(`/payments/bank/${transactionId}/match/`, { unit_number: unitNumber.trim() })
      toast({ title: 'Success', description: 'Transaction matched successfully' })
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to match transaction', variant: 'destructive' })
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Match Bank Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Unit Number</Label>
            <div className="col-span-3">
              <Input
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. W1002"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleMatch} disabled={loading}>{loading ? 'Matching...' : 'Match'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}