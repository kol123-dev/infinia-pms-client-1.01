import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tenant } from "../types"
import { useState } from "react"
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
    }
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const tenantResponse = await api.patch(`/tenants/${tenant.id}/`, {
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        emergency_contact: formData.emergency_contact
      })

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