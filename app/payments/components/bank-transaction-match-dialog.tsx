import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import api from '@/lib/axios'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  onSuccess: () => void
}

export function BankTransactionMatchDialog({ isOpen, onClose, transactionId, onSuccess }: Props) {
    const [tenants, setTenants] = useState<any[]>([])
    const [selectedTenant, setSelectedTenant] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const fetchTenants = useCallback(async () => {
      try {
        const response = await api.get("/tenants/", { params: { page: 1, page_size: 50 } })
        const payload = response?.data
        const list = Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload)
          ? payload
          : []
        setTenants(list)
      } catch (error) {
        console.error("Error fetching tenants:", error)
        setTenants([])
      }
    }, [])

    useEffect(() => {
      if (isOpen) {
        fetchTenants()
      }
    }, [isOpen, fetchTenants])

    const handleMatch = async () => {
      const tenantId = selectedTenant?.trim()
      if (!tenantId) {
        toast({
          title: 'Error',
          description: 'Please select a tenant to match this transaction',
          variant: 'destructive',
        })
        return
      }

      setLoading(true)
      try {
        await api.post(`/payments/bank/${transactionId}/match/`, { tenant_id: tenantId })
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
              <Label className="text-right">Tenant</Label>
              <div className="col-span-3">
                <Combobox
                  items={(Array.isArray(tenants) ? tenants : []).map((tenant) => ({
                    label: `${tenant.user?.full_name || ""} - ${tenant.current_unit?.unit_number || ""} (${tenant.current_unit?.property?.name || ""})`,
                    value: String(tenant.id),
                  }))}
                  value={selectedTenant}
                  onChange={setSelectedTenant}
                  placeholder="Select tenant"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleMatch} disabled={loading}>
              {loading ? 'Matching...' : 'Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
}