import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tenant, Unit } from "../types"
import { Badge } from "@/components/ui/badge"
import { 
  User, Phone, Home, Calendar, DollarSign, Edit, LogOut, 
  AlertCircle, FileText, CreditCard, Building, Mail,
  Heart, Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import api from "@/lib/axios"
import { TenantEditDialog } from "./tenant-edit-dialog"

interface TenantDetailsProps {
  tenant: Tenant
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
  onEdit?: (tenant: Tenant) => void
}

export function TenantDetails({ tenant, isOpen, onClose, onDelete, onEdit }: TenantDetailsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMoveOutConfirm, setShowMoveOutConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [emergencyContact, setEmergencyContact] = useState<any>(null)
  const [contracts, setContracts] = useState<any[]>([])
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState('')
  const [isAssigningUnit, setIsAssigningUnit] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [leaseStartDate, setLeaseStartDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')
  
  useEffect(() => {
    if (isOpen && tenant.id) {
      console.log('Fetching payment history for tenant:', tenant.id)
      api.get(`/payments/payments/?tenant=${tenant.id}`)
        .then(response => {
          console.log('Payment history response:', response.data)
          if (response.data && response.data.results) {
            setPaymentHistory(response.data.results)
          } else {
            console.error('Invalid payment history data structure:', response.data)
            setPaymentHistory([])
          }
        })
        .catch(error => {
          console.error('Error fetching payment history:', error)
          setPaymentHistory([])
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load payment history"
          })
        })
  
      setEmergencyContact(tenant.emergency_contact)
  
      api.get('/properties/')
        .then(response => setProperties(response.data.results))
        .catch(error => console.error('Error fetching properties:', error))
    }
  }, [isOpen, tenant.id, tenant.emergency_contact])
  
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedProperty) {
        setAvailableUnits([])
        return
      }
      try {
        const response = await api.get(`/properties/${selectedProperty}/units/`)
        const vacantUnits = response.data.results.filter((unit: Unit) => unit.unit_status === 'VACANT')
        setAvailableUnits(vacantUnits)
      } catch (error) {
        console.error('Error fetching units:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load units"
        })
      }
    }
    fetchUnits()
  }, [selectedProperty])
  
  const handleAssignUnit = async () => {
    if (!selectedUnit || !leaseStartDate || !leaseEndDate) return
    
    setIsAssigningUnit(true)
    try {
      await api.post(`/units/${selectedUnit}/assign_tenant/`, {
        tenant_id: tenant.id,
        lease_start_date: leaseStartDate,
        lease_end_date: leaseEndDate
      })
      toast({
        title: "Success",
        description: "Unit assigned successfully"
      })
      onClose()
    } catch (error) {
      console.error('Error assigning unit:', error)
      toast({
        title: "Error",
        description: "Failed to assign unit",
        variant: "destructive"
      })
    } finally {
      setIsAssigningUnit(false)
    }
  }

  const handleMoveOut = async (tenant: Tenant) => {
    if (!confirm(`Are you sure you want to move out ${tenant.user?.full_name}?`)) return;
    try {
      await api.patch(`/tenants/${tenant.id}/`, {
        tenant_status: 'PAST',
        move_out_date: new Date().toISOString().split('T')[0]
      });
      if (tenant.current_unit?.id) {
        await api.patch(`/units/${tenant.current_unit.id}/`, { unit_status: 'VACANT', current_tenant: null });
      }
      toast({ description: "Tenant moved out successfully" });
      onClose();
    } catch (error) {
      toast({ variant: "destructive", description: "Failed to move out tenant" });
    }
  };

  const handleUpdate = (updatedTenant: Tenant) => {
    if (onEdit) {
      onEdit(updatedTenant)
    }
    setShowEditDialog(false)
    onClose()
    toast({
      title: "Success",
      description: "Tenant details updated successfully"
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-semibold">{tenant.user?.full_name || 'Tenant Details'}</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">DOB: {tenant.date_of_birth ? format(new Date(tenant.date_of_birth), 'PP') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={tenant.tenant_status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                  {tenant.tenant_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Unit and Lease Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Home className="h-5 w-5" />
              Unit and Lease Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Unit: {tenant.current_unit?.unit_number || 'No unit assigned'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Move-in: {tenant.move_in_date ? format(new Date(tenant.move_in_date), 'PP') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Rent: ${tenant.rent_amount || 0}/month</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {emergencyContact && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{emergencyContact.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{emergencyContact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Relationship: {emergencyContact.relationship}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </h3>
            <div className="space-y-2">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Payment ID: {payment.payment_id}</span>
                        <span className="text-sm">Amount: ${payment.amount}</span>
                        <span className="text-xs text-muted-foreground">
                          Date: {payment.paid_date ? format(new Date(payment.paid_date), 'PP') : 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Method: {payment.payment_method} | Type: {payment.payment_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Reference: {payment.account_reference}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={payment.payment_status.toLowerCase() === 'paid' ? 'default' : 'secondary'}>
                        {payment.payment_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Balance: ${payment.balance_after}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground p-4">
                  No payment history available
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenant.lease_agreement_url && (
                <Button variant="outline" className="flex items-center gap-2 w-full" asChild>
                  <a href={tenant.lease_agreement_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" /> Lease Agreement
                  </a>
                </Button>
              )}
              {tenant.id_verification_url && (
                <Button variant="outline" className="flex items-center gap-2 w-full" asChild>
                  <a href={tenant.id_verification_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" /> ID Verification
                  </a>
                </Button>
              )}
              {tenant.proof_of_income_url && (
                <Button variant="outline" className="flex items-center gap-2 w-full" asChild>
                  <a href={tenant.proof_of_income_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" /> Proof of Income
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Unit Assignment */}
          {!tenant.current_unit && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Assign Unit
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unit (Vacant Only)</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedProperty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit: { id: number; unit_number: string }) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lease Start Date</Label>
                    <Input
                      type="date"
                      value={leaseStartDate}
                      onChange={(e) => setLeaseStartDate(e.target.value)}
                      disabled={!selectedUnit}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lease End Date</Label>
                    <Input
                      type="date"
                      value={leaseEndDate}
                      onChange={(e) => setLeaseEndDate(e.target.value)}
                      disabled={!selectedUnit}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAssignUnit}
                  disabled={!selectedUnit || !leaseStartDate || !leaseEndDate || isAssigningUnit}
                  className="w-full"
                >
                  {isAssigningUnit ? 'Assigning...' : 'Assign Unit'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => handleMoveOut(tenant)}
            >
              Move Out
            </Button>
          </div>
        </DialogFooter>

        {showEditDialog && (
          <TenantEditDialog
            tenant={tenant}
            isOpen={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            onUpdate={handleUpdate}
          />
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tenant</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Type "DELETE" to confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={deleteText !== 'DELETE'}
              >
                Delete Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}