import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tenant, Unit } from "../types"
import { Badge } from "@/components/ui/badge"
import { 
  User, Phone, Home, Calendar, DollarSign, Edit, LogOut, 
  AlertCircle, FileText, CreditCard, Building, Mail,
  Heart, Trash, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { format, intervalToDuration, parseISO } from "date-fns"
import api from "@/lib/axios"
import { TenantEditDialog } from "./tenant-edit-dialog"
import { useRouter } from 'next/navigation';  // Add this line

interface TenantDetailsProps {
  tenant: Tenant
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
  onEdit?: (tenant: Tenant) => void
}

export function TenantDetails({ tenant, isOpen, onClose, onDelete, onEdit }: TenantDetailsProps) {
  const router = useRouter();  // Add this line for redirection
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMoveOutConfirm, setShowMoveOutConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState('')
  const [isAssigningUnit, setIsAssigningUnit] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [leaseStartDate, setLeaseStartDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')
  const [moveOutDate, setMoveOutDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
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
          }
        })
        .catch(error => {
          console.error('Error fetching payment history:', error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch payment history"
          })
        })

      api.get('/properties/')
        .then(response => {
          setProperties(response.data.results || response.data)
        })
        .catch(error => {
          console.error('Error fetching properties:', error)
        })
    }
  }, [isOpen, tenant.id])

  useEffect(() => {
    if (selectedProperty) {
      api.get(`/properties/${selectedProperty}/units/?status=VACANT`)
        .then(response => {
          setAvailableUnits(response.data.results || response.data)
        })
        .catch(error => {
          console.error('Error fetching available units:', error)
        })
    }
  }, [selectedProperty])

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (deleteText === 'DELETE') {
      onDelete?.()
      setShowDeleteConfirm(false)
    }
  }

  const handleMoveOut = () => {
    setShowMoveOutConfirm(true)
  }

  const confirmMoveOut = async () => {
    if (!tenant.current_unit?.id || !tenant.current_unit?.property?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing unit or property information"
      })
      return
    }

    try {
      await api.post(`/properties/${tenant.current_unit.property.id}/units/${tenant.current_unit.id}/end_tenancy/`, {
        end_date: moveOutDate
      })

      // Fetch updated tenant data
      const response = await api.get(`/tenants/${tenant.id}/`)
      const updatedTenant = response.data

      onEdit?.(updatedTenant)
      setShowMoveOutConfirm(false)
      toast({
        title: "Success",
        description: "Tenant moved out successfully"
      })
      onClose();  // Close the dialog
      router.push('/tenants');  // Redirect to tenants page
    } catch (error) {
      console.error('Error moving out tenant:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to move out tenant"
      })
    }
  }

  const handleAssignUnit = async () => {
    if (!selectedUnit || !leaseStartDate) return

    try {
      setIsAssigningUnit(true)
      const response = await api.post('/tenants/assign-unit/', {
        tenant_id: tenant.id,
        unit_id: parseInt(selectedUnit),
        start_date: leaseStartDate,
        end_date: leaseEndDate || null
      })

      toast({
        title: "Success",
        description: "Unit assigned successfully"
      })

      onEdit?.(response.data)
    } catch (error) {
      console.error('Error assigning unit:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign unit"
      })
    } finally {
      setIsAssigningUnit(false)
    }
  }

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleUpdate = (updatedTenant: Tenant) => {
    onEdit?.(updatedTenant)
    setShowEditDialog(false)
    toast({
      title: "Success",
      description: "Tenant details updated successfully"
    })
  }

  const calculateStayDuration = (startDate: string | null) => {
    if (!startDate) return 'N/A';
    
    const moveIn = new Date(startDate);
    const now = new Date();
    
    if (moveIn > now) return '0 months, 0 days';
    
    const duration = intervalToDuration({ start: moveIn, end: now });
    const totalMonths = (duration.years || 0) * 12 + (duration.months || 0);
    
    return `${totalMonths} months, ${duration.days || 0} days`;
  };

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
                <span className="text-sm">DOB: {tenant.date_of_birth ? format(parseISO(tenant.date_of_birth), 'PP') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={tenant.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
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
                <span className="text-sm">
                  Unit: {tenant.last_unit?.unit_number || tenant.current_unit?.unit_number || (tenant.status === 'PAST' ? 'Previous Unit' : 'No unit assigned')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Move-in: {tenant.lease_start_date ? format(parseISO(tenant.lease_start_date), 'PP') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Move-out: {tenant.lease_end_date ? format(parseISO(tenant.lease_end_date), 'PP') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Rent: ${tenant.rent_amount || 0}/month</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Time Stayed: {calculateStayDuration(tenant.lease_start_date || null)}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {tenant.emergency_contact && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tenant.emergency_contact.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tenant.emergency_contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Relationship: {tenant.emergency_contact.relationship}</span>
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
                          Date: {payment.paid_date ? format(parseISO(payment.paid_date), 'PP') : 'N/A'}
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
          {!tenant.current_unit && tenant.status !== 'PAST' && (
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
                  disabled={!selectedUnit || !leaseStartDate || isAssigningUnit}
                >
                  Assign Unit
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 flex justify-between border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            {tenant.current_unit && (
              <Button variant="destructive" onClick={handleMoveOut}>
                <LogOut className="mr-2 h-4 w-4" /> Move Out
              </Button>
            )}
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Edit Dialog */}
      <TenantEditDialog
        tenant={tenant}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onUpdate={handleUpdate}
      />

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Type DELETE"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteText !== 'DELETE'}
            >
              Delete Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Out Confirmation */}
      <Dialog open={showMoveOutConfirm} onOpenChange={setShowMoveOutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Out Tenant</DialogTitle>
            <DialogDescription>
              Confirm moving out the tenant from their unit. Please select the move out date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Move Out Date</Label>
            <Input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveOutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmMoveOut}>
              Confirm Move Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}