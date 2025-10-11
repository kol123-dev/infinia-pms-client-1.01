import { useEffect, useState, ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { Tenant, Unit, Landlord } from "../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Property } from "@/app/properties/types"
import { toast } from "@/components/ui/use-toast"
import { X } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"  // Add this import if not already present

// Base interfaces for all forms
interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
}

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
  userData: any | null;
  tenant?: Tenant;
}

interface UnitAssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
  tenantData: any;
}

// Common dialog styles for reuse
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

export function UserCreationForm({ isOpen, onClose, onSuccess }: UserFormProps): ReactElement {
  const [formData, setFormData] = useState({
    email: "",
    password: "1234567",  // Default password set here
    first_name: "",
    last_name: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userResponse = await api.post('/auth/create-user/', {
        ...formData,
        role: 'tenant'
      });
      
      // Pass the entire response data to onSuccess
      await onSuccess(userResponse.data);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user"
      });
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
            <span className={stepIndicatorStyles}>Step 1 of 3</span>
          </div>
          <DialogDescription className={dialogDescriptionStyles}>
            Enter the user's details to create their account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={formStyles}>
          <div className={inputGroupStyles}>
            <Label htmlFor="email" className={labelStyles}>Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={inputStyles}
              disabled={isLoading}
              required
            />
          </div>
          <div className={inputGroupStyles}>
            <Label htmlFor="password" className={labelStyles}>Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {}}  // Prevent changes
              className={inputStyles}
              disabled={isLoading}
              readOnly  // Make it non-editable
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={inputGroupStyles}>
              <Label htmlFor="first_name" className={labelStyles}>First name</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="John"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className={inputStyles}
                disabled={isLoading}
                required
              />
            </div>
            <div className={inputGroupStyles}>
              <Label htmlFor="last_name" className={labelStyles}>Last name</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className={inputStyles}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <div className={inputGroupStyles}>
            <Label htmlFor="phone" className={labelStyles}>Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={inputStyles}
              disabled={isLoading}
              required
            />
          </div>
          <Button 
            type="submit" 
            className={buttonStyles}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}

export function TenantCreationForm({ isOpen, onClose, onSuccess, userData }: TenantFormProps): ReactElement {
  const [formData, setFormData] = useState({
    date_of_birth: "",
    tenant_status: "APPLICANT",  // Changed from tenant_status
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const tenantData = {
        user: userData.id,
        date_of_birth: formData.date_of_birth,
        tenant_status: formData.tenant_status,
        phone: userData.phone,
        emergency_contact: {
          name: formData.emergency_contact_name,
          phone: formData.emergency_contact_phone,
          relationship: formData.emergency_contact_relationship
        }
      };

      const tenantResponse = await api.post('/tenants/', tenantData);
      await onSuccess(tenantResponse.data);
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create tenant"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentStyles}>
        <DialogHeader className={dialogHeaderStyles}>
          <div className="flex items-center justify-between">
            <DialogTitle className={dialogTitleStyles}>New Tenant</DialogTitle>
            <span className={stepIndicatorStyles}>Step 1 of 3</span>
          </div>
          <DialogDescription className={dialogDescriptionStyles}>
            Enter the user's details to create their account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={formStyles}>
          <div className="grid grid-cols-2 gap-4">
            <div className={inputGroupStyles}>
              <Label htmlFor="date_of_birth" className={labelStyles}>Date of birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className={inputStyles}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground/90">Emergency Contact</h3>
            <div className={inputGroupStyles}>
              <Label htmlFor="emergency_contact_name" className={labelStyles}>Full name</Label>
              <Input
                id="emergency_contact_name"
                type="text"
                placeholder="Jane Doe"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                className={inputStyles}
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={inputGroupStyles}>
                <Label htmlFor="emergency_contact_phone" className={labelStyles}>Phone number</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="+254700000000"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  className={inputStyles}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className={inputGroupStyles}>
                <Label htmlFor="emergency_contact_relationship" className={labelStyles}>Relationship</Label>
                <Input
                  id="emergency_contact_relationship"
                  type="text"
                  placeholder="Parent"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                  className={inputStyles}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className={buttonStyles}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating profile...
              </>
            ) : (
              'Create profile'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UnitAssignmentForm({ isOpen, onClose, onSuccess, tenantData }: UnitAssignmentFormProps): ReactElement {
  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    move_in_date: "",
    move_out_date: ""
  });
  const [isMoveOutUnknown, setIsMoveOutUnknown] = useState(true);  // New state: default to Unknown
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/properties/');
        setProperties(response.data.results || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load properties"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.property_id) {
        setUnits([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.get(`/properties/${formData.property_id}/units/?status=VACANT`);
        setUnits(response.data.results || []);
      } catch (error) {
        console.error('Error fetching units:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load units"
        });
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUnits();
  }, [formData.property_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        tenant_id: tenantData.id,
        lease_start_date: formData.move_in_date,
        lease_end_date: isMoveOutUnknown ? null : formData.move_out_date
      };
      const response = await api.post(`/units/${formData.unit_id}/assign_tenant/`, payload);
      await onSuccess(response.data);
    } catch (error: any) {
      console.error('Error assigning unit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign unit"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentStyles}>
        <DialogHeader className={dialogHeaderStyles}>
          <div className="flex items-center justify-between">
            <DialogTitle className={dialogTitleStyles}>Assign Unit</DialogTitle>
            <span className={stepIndicatorStyles}>Step 3 of 3</span>
          </div>
          <DialogDescription className={dialogDescriptionStyles}>
            Assign a unit to {tenantData?.user?.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={formStyles}>
          <div className={inputGroupStyles}>
            <Label htmlFor="property" className={labelStyles}>Property</Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value, unit_id: "" }))}
              disabled={isLoading}
            >
              <SelectTrigger className={inputStyles}>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(properties) && properties.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={inputGroupStyles}>
            <Label htmlFor="unit" className={labelStyles}>Unit</Label>
            <Select
              value={formData.unit_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
              disabled={isLoading || !formData.property_id}
            >
              <SelectTrigger className={inputStyles}>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(units) && units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.unit_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={inputGroupStyles}>
              <Label htmlFor="move_in_date" className={labelStyles}>Move-in date</Label>
              <Input
                id="move_in_date"
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData(prev => ({ ...prev, move_in_date: e.target.value }))}
                className={inputStyles}
                disabled={isLoading}
                required
              />
            </div>
            <div className={inputGroupStyles}>
              <Label className={labelStyles}>Move-out date</Label>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="move_out_unknown" 
                  checked={isMoveOutUnknown} 
                  onCheckedChange={(checked) => setIsMoveOutUnknown(!!checked)} 
                  disabled={isLoading}
                />
                <label htmlFor="move_out_unknown" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Unknown
                </label>
              </div>
              {!isMoveOutUnknown && (
                <Input
                  id="move_out_date"
                  type="date"
                  value={formData.move_out_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, move_out_date: e.target.value }))}
                  className={inputStyles}
                  disabled={isLoading}
                  required
                />
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className={buttonStyles}
            disabled={isLoading || !formData.unit_id}
          >
            {isLoading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Assigning unit...
              </>
            ) : (
              'Assign unit'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TenantOnboardingFlow({ onClose }: { onClose: () => void }): ReactElement {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>(null);
  const [tenantData, setTenantData] = useState<any>(null);

  const handleClose = () => {
    // Reset everything when the flow is cancelled
    setStep(1);
    setUserData(null);
    setTenantData(null);
    onClose(); // Call the parent's onClose function
  };

  const handleUserCreated = async (data: any) => {
    const user = data.user;
    if (!user || !user.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid user data received"
      });
      return;
    }
    setUserData(user);
    setStep(2);
  };

  const handleTenantCreated = async (data: any) => {
    setTenantData(data);
    setStep(3);
  };

  const handleUnitAssigned = async (data: any) => {
    // Close all dialogs and reset state
    handleClose();
  };

  return (
    <>
      <UserCreationForm
        isOpen={step === 1}
        onClose={handleClose}
        onSuccess={handleUserCreated}
      />
      {userData && (
        <TenantCreationForm
          isOpen={step === 2}
          onClose={handleClose}
          onSuccess={handleTenantCreated}
          userData={userData}
        />
      )}
      {tenantData && (
        <UnitAssignmentForm
          isOpen={step === 3}
          onClose={handleClose}
          onSuccess={handleUnitAssigned}
          tenantData={tenantData}
        />
      )}
    </>
  );
}