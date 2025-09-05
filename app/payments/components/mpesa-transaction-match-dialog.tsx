import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/use-toast'
import api from '@/lib/axios'

interface MpesaTransactionMatchDialogProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  onSuccess: () => void
}

export function MpesaTransactionMatchDialog({
  isOpen,
  onClose,
  transactionId,
  onSuccess,
}: MpesaTransactionMatchDialogProps) {
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Fetch tenants when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTenants()
    }
  }, [isOpen])

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants/')
      // Extract tenants from the results array in the paginated response
      const tenantsData = response.data.results || []
      setTenants(tenantsData)
    } catch (error) {
      console.error('Error fetching tenants:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tenants. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleMatch = async () => {
    if (!selectedTenant) {
      toast({
        title: 'Error',
        description: 'Please select a tenant',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await api.post(`/payments/mpesa/${transactionId}/match/`, {
        tenant_id: selectedTenant,
      })
      
      toast({
        title: 'Success',
        description: 'Transaction successfully matched to tenant',
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error matching transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to match transaction. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Match M-Pesa Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenant" className="text-right">
              Tenant
            </Label>
            <div className="col-span-3">
              <Combobox
                items={tenants.map((tenant) => ({
                  label: `${tenant.user?.full_name || ''} - ${tenant.current_unit?.unit_number || ''} (${tenant.current_unit?.property?.name || ''})`,
                  value: tenant.id,
                }))}
                value={selectedTenant}
                onChange={setSelectedTenant}
                placeholder="Select tenant"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMatch} disabled={isLoading}>
            {isLoading ? 'Matching...' : 'Match Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}