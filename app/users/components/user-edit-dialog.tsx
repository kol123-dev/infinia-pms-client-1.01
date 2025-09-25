import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import api from "@/lib/axios"
import { format } from "date-fns"
import { Property } from "@/app/properties/types"
import { Unit } from "@/app/tenants/types" // Reuse

interface UserEditDialogProps {
  user: any; // User type with role, profile, etc.
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export function UserEditDialog({ user, isOpen, onClose, onUpdate }: UserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  // Define types for formData to help TypeScript
  type CommonFormData = {
    first_name: string;
    last_name: string;
    phone: string;
    property_id: string;
    unit_id: string;
    lease_start_date: string;
    lease_end_date: string;
  };
  
  type TenantFormData = CommonFormData & {
    date_of_birth: string;
    tenant_status: string;
    emergency_contact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  type LandlordFormData = CommonFormData & {
    company_name: string;
    address: string;
  };
  
  // In the component, use a union type for formData
  const [formData, setFormData] = useState<TenantFormData | LandlordFormData>({
    ...(user.role === 'tenant' 
      ? {
          date_of_birth: user.profile?.date_of_birth ? format(new Date(user.profile.date_of_birth), 'yyyy-MM-dd') : '',
          tenant_status: user.profile?.tenant_status || 'APPLICANT',
          emergency_contact: {
            name: user.profile?.emergency_contact?.name || '',
            phone: user.profile?.emergency_contact?.phone || '',
            relationship: user.profile?.emergency_contact?.relationship || ''
          }
        } : {
            company_name: user.profile?.company_name || '',
            address: user.profile?.address || ''
          }),
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    property_id: user.profile?.current_unit?.property?.id?.toString() || '',
    unit_id: user.profile?.current_unit?.id?.toString() || '',
    lease_start_date: user.profile?.lease_start_date || '',
    lease_end_date: user.profile?.lease_end_date || ''
  });
  
  useEffect(() => {
    const fetchProperties = async () => {
      const response = await api.get('/properties/');
      setProperties(response.data.results);
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.property_id) return;
      const response = await api.get(`/properties/${formData.property_id}/units/`);
      setAvailableUnits(response.data.results.filter((u: Unit) => u.unit_status === 'VACANT' || u.id.toString() === formData.unit_id));
    };
    fetchUnits();
  }, [formData.property_id, formData.unit_id]);  // Add formData.unit_id here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Update basic user details (assuming an existing endpoint; adjust if needed)
      await api.patch(`/auth/users/${user.id}/`, {  // If this causes 404, change to '/auth/me/' or add backend support
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });
  
      if (user.role === 'tenant') {
        // Check for existing Tenant profile
        const tenantResponse = await api.get(`/tenants/?user=${user.id}`);
        const existingTenant = tenantResponse.data.results[0];  // Assume first result is the match
  
        const tenantData = {
          user: user.id,  // Link to this user (assigns profile)
          current_unit: parseInt(formData.unit_id) || null,  // Assign unit
          date_of_birth: (formData as TenantFormData).date_of_birth,
          status: (formData as TenantFormData).tenant_status,
          emergency_contact: (formData as TenantFormData).emergency_contact,
          move_in_date: formData.lease_start_date,  // Map to move_in_date if needed
          // Add other fields as per TenantWriteSerializer
        };
  
        let updatedTenant;
        if (existingTenant) {
          // Update existing Tenant (assign/update profile and unit)
          updatedTenant = await api.put(`/tenants/${existingTenant.id}/`, tenantData);
        } else {
          // Create new Tenant (assign profile and unit)
          updatedTenant = await api.post(`/tenants/`, tenantData);
        }
  
        // Optional: If unit assignment needs extra action (e.g., mark unit occupied), call Unit endpoint
        if (formData.unit_id && updatedTenant.data.current_unit) {
          await api.post(`/units/${formData.unit_id}/assign_tenant/`, {  // If this action exists in UnitViewSet
            tenant_id: updatedTenant.data.id,
            lease_start_date: formData.lease_start_date,
            lease_end_date: formData.lease_end_date
          });
        }
      } else {
        // Handle non-tenant profiles (e.g., landlord) as before
        const endpoint = `/landlords/${user.profile?.id}/`;  // Adjust for other roles
        await api.patch(endpoint, formData);
      }
  
      toast({ title: "Success", description: "User profile and unit assigned" });
      onUpdate(user);
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update/assign" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          {/* User fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>First Name</Label><Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></div>
            <div><Label>Last Name</Label><Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div>
          </div>
          <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>

          {/* Profile fields */}
          {user.role === 'tenant' ? (
            <>
              <div><Label>Date of Birth</Label><Input type="date" value={(formData as TenantFormData).date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={(formData as TenantFormData).tenant_status} onValueChange={(v) => setFormData({ ...formData, tenant_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="APPLICANT">Applicant</SelectItem><SelectItem value="ACTIVE">Active</SelectItem></SelectContent>
                </Select>
              </div>
              {/* Emergency contact */}
              <div><Label>Emergency Name</Label><Input value={(formData as TenantFormData).emergency_contact.name} onChange={(e) => setFormData({ ...formData, emergency_contact: { ...(formData as TenantFormData).emergency_contact, name: e.target.value } })} /></div>
              <div><Label>Emergency Phone</Label><Input value={(formData as TenantFormData).emergency_contact.phone} onChange={(e) => setFormData({ ...formData, emergency_contact: { ...(formData as TenantFormData).emergency_contact, phone: e.target.value } })} /></div>
              <div><Label>Relationship</Label><Input value={(formData as TenantFormData).emergency_contact.relationship} onChange={(e) => setFormData({ ...formData, emergency_contact: { ...(formData as TenantFormData).emergency_contact, relationship: e.target.value } })} /></div>
            </>
          ) : (
            <>
              <div><Label>Company Name</Label><Input value={(formData as LandlordFormData).company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value } as LandlordFormData)} /></div>
              <div><Label>Address</Label><Input value={(formData as LandlordFormData).address} onChange={(e) => setFormData({ ...formData, address: e.target.value } as LandlordFormData)} /></div>
            </>
          )}

          {/* Unit assignment for tenants */}
          {user.role === 'tenant' && (
            <>
              <div><Label>Property</Label>
                <Select value={formData.property_id} onValueChange={(v) => setFormData({ ...formData, property_id: v, unit_id: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Unit</Label>
                <Select value={formData.unit_id} onValueChange={(v) => setFormData({ ...formData, unit_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{availableUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.unit_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Lease Start</Label><Input type="date" value={formData.lease_start_date} onChange={(e) => setFormData({ ...formData, lease_start_date: e.target.value })} /></div>
                <div><Label>Lease End</Label><Input type="date" value={formData.lease_end_date} onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })} /></div>
              </div>
            </>
          )}
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Updating...' : 'Save Changes'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}