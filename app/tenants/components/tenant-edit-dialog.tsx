import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tenant, Unit } from "../types"
import { Property } from "@/app/properties/types"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import api from "@/lib/axios"
import { format } from "date-fns"

interface TenantEditDialogProps {
  tenant: Tenant
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedTenant: Tenant) => void
}

export function TenantEditDialog({ tenant, isOpen, onClose, onUpdate }: TenantEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  // Remove rent_amount from formData
  const [formData, setFormData] = useState({
    phone: tenant.phone || '',
    date_of_birth: tenant.date_of_birth ? format(new Date(tenant.date_of_birth), 'yyyy-MM-dd') : '',
    user: {
      first_name: tenant.user?.full_name?.split(' ')[0] || '',
      last_name: tenant.user?.full_name?.split(' ').slice(1).join(' ') || ''
    },
    emergency_contact: {
      name: tenant.emergency_contact?.name || '',
      phone: tenant.emergency_contact?.phone || '',
      relationship: tenant.emergency_contact?.relationship || ''
    },
    property_id: '',
    unit_id: '',
    lease_start_date: '',
    lease_end_date: ''
  })
  
  // Remove rent_amount from PATCH request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const tenantResponse = await api.patch(`/tenants/${tenant.id}/`, {
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        emergency_contact: formData.emergency_contact
      })

      // If unit is selected, assign it to the tenant
      if (formData.unit_id && formData.lease_start_date && formData.lease_end_date) {
        await api.post(`/units/${formData.unit_id}/assign_tenant/`, {
          tenant_id: tenant.id,
          lease_start_date: formData.lease_start_date,
          lease_end_date: formData.lease_end_date
        })
      }

      onUpdate(tenantResponse.data)
      toast({
        title: "Success",
        description: "Tenant updated successfully"
      })
      onClose()
    } catch (error) {
      console.error('Error updating tenant:', error)
      toast({
        title: "Error",
        description: "Failed to update tenant",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties/')
        setProperties(response.data.results)
      } catch (error) {
        console.error('Error fetching properties:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load properties"
        })
      }
    }
    fetchProperties()
  }, [])

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.property_id) {
        setAvailableUnits([])
        return
      }
      try {
        const response = await api.get(`/properties/${formData.property_id}/units/`)
        // Filter only vacant units
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
  }, [formData.property_id])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <div className="grid gap-6">
            {/* User Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium leading-none">User Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.user.first_name}
                    onChange={(e) => setFormData({
                      ...formData,
                      user: { ...formData.user, first_name: e.target.value }
                    })}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.user.last_name}
                    onChange={(e) => setFormData({
                      ...formData,
                      user: { ...formData.user, last_name: e.target.value }
                    })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>

            {/* Basic Information */}
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium leading-none">Basic Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
            
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium leading-none">Emergency Contact</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_name">Name</Label>
                  <Input
                    id="emergency_name"
                    value={formData.emergency_contact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergency_contact: { ...formData.emergency_contact, name: e.target.value }
                    })}
                    placeholder="Enter contact name"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_contact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergency_contact: { ...formData.emergency_contact, phone: e.target.value }
                      })}
                      placeholder="Enter contact phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_relationship">Relationship</Label>
                    <Input
                      id="emergency_relationship"
                      value={formData.emergency_contact.relationship}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergency_contact: { ...formData.emergency_contact, relationship: e.target.value }
                      })}
                      placeholder="Enter relationship"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Assignment */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium leading-none">Unit Assignment</h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) => setFormData({ ...formData, property_id: value, unit_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
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
                <Label htmlFor="unit">Unit (Vacant Only)</Label>
                <Select
                  value={formData.unit_id}
                  onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                  disabled={!formData.property_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lease_start_date">Lease Start Date</Label>
                  <Input
                    id="lease_start_date"
                    type="date"
                    value={formData.lease_start_date}
                    onChange={(e) => setFormData({ ...formData, lease_start_date: e.target.value })}
                    disabled={!formData.unit_id}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lease_end_date">Lease End Date</Label>
                  <Input
                    id="lease_end_date"
                    type="date"
                    value={formData.lease_end_date}
                    onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })}
                    disabled={!formData.unit_id}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}