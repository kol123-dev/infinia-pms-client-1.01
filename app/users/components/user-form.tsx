import { useEffect, useState, ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { X } from 'lucide-react'
import { Property } from "@/app/properties/types" // Reuse from properties
import { Unit } from "@/app/tenants/types" // Reuse Unit type from tenants

// Base interfaces
interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
  step?: number; // For multi-step control
  userData?: any; // Passed between steps
  role?: 'tenant' | 'landlord'; // Selected role
}

// Common styles (mirroring tenant-form)
const dialogContentStyles = "sm:max-w-[425px] p-6 bg-background border-none shadow-lg";
const dialogHeaderStyles = "space-y-2 mb-6";
const dialogTitleStyles = "text-xl font-semibold tracking-tight";
const dialogDescriptionStyles = "text-sm text-muted-foreground";
const stepIndicatorStyles = "inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full";
const formStyles = "space-y-5";
const inputGroupStyles = "space-y-2";
const labelStyles = "text-sm font-medium text-foreground/90";
const inputStyles = "h-9 px-3 py-1 text-sm bg-background border border-input hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary";
const buttonStyles = "w-full h-9 px-4 py-2 inline-flex items-center justify-center text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50";

export function UserOnboardingFlow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant'); // Default to tenant

  const handleUserSuccess = async (data: any) => {
    setUserData(data);
    setStep(2);
  };

  const handleProfileSuccess = async (data: any) => {
    setStep(role === 'tenant' ? 3 : 4); // Skip unit assignment for non-tenants
  };

  const handleUnitSuccess = async (data: any) => {
    setStep(4); // Final success step or close
    onClose();
    toast({ description: "User created successfully" });
    // Refresh users list via parent onSuccess if needed
  };

  return (
    <>
      <UserCreationForm isOpen={isOpen && step === 1} onClose={onClose} onSuccess={handleUserSuccess} role={role} setRole={setRole} />
      <ProfileCreationForm isOpen={isOpen && step === 2} onClose={onClose} onSuccess={handleProfileSuccess} userData={userData} role={role} />
      {role === 'tenant' && <UnitAssignmentForm isOpen={isOpen && step === 3} onClose={onClose} onSuccess={handleUnitSuccess} userData={userData} />}
    </>
  );
}

export function UserCreationForm({ isOpen, onClose, onSuccess, role, setRole }: UserFormProps & { role: 'tenant' | 'landlord'; setRole: (r: 'tenant' | 'landlord') => void }): ReactElement {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/create-user/', { ...formData, role });
      await onSuccess(response.data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create user" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentStyles}>
        <DialogHeader className={dialogHeaderStyles}>
          <div className="flex items-center justify-between">
            <DialogTitle className={dialogTitleStyles}>New User</DialogTitle>
            <span className={stepIndicatorStyles}>Step 1</span>
          </div>
          <DialogDescription className={dialogDescriptionStyles}>Enter user details and select role</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={formStyles}>
          {/* Role selection */}
          <div className={inputGroupStyles}>
            <Label htmlFor="role" className={labelStyles}>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as 'tenant' | 'landlord')}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="landlord">Landlord</SelectItem>
                {/* Add other roles if needed */}
              </SelectContent>
            </Select>
          </div>
          {/* Other fields similar to tenant UserCreationForm */}
          <div className={inputGroupStyles}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className={inputGroupStyles}>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={inputGroupStyles}>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            </div>
            <div className={inputGroupStyles}>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            </div>
          </div>
          <div className={inputGroupStyles}>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create User'}</Button>
        </form>
        <button onClick={onClose} className="absolute right-4 top-4"><X className="h-4 w-4" /></button>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileCreationForm({ isOpen, onClose, onSuccess, userData, role }: UserFormProps & { role: 'tenant' | 'landlord' }): ReactElement {
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Adjust fields based on role (tenant vs landlord)
  useEffect(() => {
    if (role === 'tenant') {
      setFormData({
        date_of_birth: "",
        tenant_status: "APPLICANT",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: ""
      });
    } else if (role === 'landlord') {
      setFormData({
        // Landlord-specific fields, adjust based on backend models (e.g., from landlords/models.py)
        company_name: "",
        address: "",
        // Add more as per Landlord model
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const endpoint = role === 'tenant' ? '/tenants/' : '/landlords/';
      const profileData = { user: userData.id, ...formData };

      // Check for existing profile (for tenants only; adjust for landlords if needed)
      let existingProfile = null;
      if (role === 'tenant') {
        const response = await api.get(`/tenants/?user=${userData.id}`);
        existingProfile = response.data.results[0];  // Get the first (and likely only) match
      }

      let response;
      if (existingProfile) {
        // Update existing
        response = await api.patch(`${endpoint}${existingProfile.id}/`, profileData);
      } else {
        // Create new
        response = await api.post(endpoint, profileData);
      }

      await onSuccess(response.data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create/update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentStyles}>
        <DialogHeader>
          <DialogTitle>{role.charAt(0).toUpperCase() + role.slice(1)} Profile</DialogTitle>
          <DialogDescription>Complete profile for {userData?.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {role === 'tenant' ? (
            <>
              {/* Tenant fields similar to TenantCreationForm */}
              <div className={inputGroupStyles}>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
              </div>
              <div className={inputGroupStyles}>
                <Label htmlFor="tenant_status">Status</Label>
                <Select value={formData.tenant_status} onValueChange={(v) => setFormData({ ...formData, tenant_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPLICANT">Applicant</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    {/* Add others */}
                  </SelectContent>
                </Select>
              </div>
              {/* Emergency contact fields */}
              <div className={inputGroupStyles}>
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} />
              </div>
              <div className={inputGroupStyles}>
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} />
              </div>
              <div className={inputGroupStyles}>
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input id="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })} />
              </div>
            </>
          ) : (
            <>
              {/* Landlord fields - customize based on backend */}
              <div className={inputGroupStyles}>
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
              </div>
              <div className={inputGroupStyles}>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              {/* Add more landlord fields */}
            </>
          )}
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Profile'}</Button>
        </form>
        <button onClick={onClose} className="absolute right-4 top-4"><X className="h-4 w-4" /></button>
      </DialogContent>
    </Dialog>
  );
}

export function UnitAssignmentForm({ isOpen, onClose, onSuccess, userData }: UserFormProps): ReactElement {
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    lease_start_date: "",
    lease_end_date: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties/');
        setProperties(response.data.results);
      } catch (error) {
        toast({ variant: "destructive", description: "Failed to load properties" });
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.property_id) return;
      try {
        const response = await api.get(`/properties/${formData.property_id}/units/`);
        setAvailableUnits(response.data.results.filter((u: Unit) => u.unit_status === 'VACANT'));
      } catch (error) {
        toast({ variant: "destructive", description: "Failed to load units" });
      }
    };
    fetchUnits();
  }, [formData.property_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check for existing Tenant
      const tenantResponse = await api.get(`/tenants/?user=${userData.id}`);
      let tenant = tenantResponse.data.results[0];

      if (!tenant) {
        // Create minimal Tenant if none exists
        const minimalData = { user: userData.id, tenant_status: "APPLICANT" };  // Add minimal required fields
        const createResponse = await api.post('/tenants/', minimalData);
        tenant = createResponse.data;
      }

      // Now assign unit using the Tenant ID
      await api.post(`/units/${formData.unit_id}/assign_tenant/`, {
        tenant_id: tenant.id,  // Use Tenant ID, not User ID
        lease_start_date: formData.lease_start_date,
        lease_end_date: formData.lease_end_date
      });
      await onSuccess({});
    } catch (error: any) {
      console.error('Assignment error:', error);  // For debugging
      let errorMsg = error.message || "Failed to assign unit";
      if (error.response?.status === 404) {
        errorMsg = "Tenant not found—check backend permissions and database for ID mismatches.";
      }
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentStyles}>
        <DialogHeader>
          <DialogTitle>Assign Unit</DialogTitle>
          <DialogDescription>Select a unit for the tenant</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className={inputGroupStyles}>
            <Label htmlFor="property">Property</Label>
            <Select value={formData.property_id} onValueChange={(v) => setFormData({ ...formData, property_id: v, unit_id: '' })}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className={inputGroupStyles}>
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit_id} onValueChange={(v) => setFormData({ ...formData, unit_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent>
                {availableUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.unit_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={inputGroupStyles}>
              <Label htmlFor="lease_start_date">Lease Start</Label>
              <Input id="lease_start_date" type="date" value={formData.lease_start_date} onChange={(e) => setFormData({ ...formData, lease_start_date: e.target.value })} />
            </div>
            <div className={inputGroupStyles}>
              <Label htmlFor="lease_end_date">Lease End</Label>
              <Input id="lease_end_date" type="date" value={formData.lease_end_date} onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })} />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Assigning...' : 'Assign Unit'}</Button>
        </form>
        <button onClick={onClose} className="absolute right-4 top-4"><X className="h-4 w-4" /></button>
      </DialogContent>
    </Dialog>
  );
}