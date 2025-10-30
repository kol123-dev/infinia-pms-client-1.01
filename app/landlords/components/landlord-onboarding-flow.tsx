// module imports
import { useState, ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useUser } from "@/lib/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { PhoneField } from "@/components/ui/phone-field";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
}

function UserCreationForm({ isOpen, onClose, onSuccess }: UserFormProps): ReactElement {
  const { toast } = useToast();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "1234567", // Default password as requested
    first_name: "",
    last_name: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create the user
      const response = await api.post('/auth/create-user/', {
        ...formData,
        role: 'landlord'
      });
      
      // Wait a moment for the signal to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the created landlord
      const landlordResponse = await api.get('/landlords/', {
        params: {
          user: response.data.id
        }
      });
      
      if (landlordResponse.data.results.length > 0) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Landlord user created successfully",
          duration: 3000
        });
        onSuccess({
          user: response.data,
          landlord: landlordResponse.data.results[0]
        });
        onClose();
      } else {
        throw new Error('Landlord profile not found');
      }
    } catch (error: any) {
      const data = error?.response?.data
      let description = data?.error || data?.message || "Failed to create user"
      if (data?.errors && typeof data.errors === 'object') {
        const messages = Object.entries(data.errors).map(([field, msg]) => {
          const text = Array.isArray(msg) ? msg.join(', ') : msg
          return `${field}: ${text}`
        })
        description = messages.join(' | ')
      }
      toast({
        variant: "destructive",
        title: "Validation Error",
        description,
        duration: 5000
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <PhoneField
                value={formData.phone}
                onChange={(val: string) => setFormData({ ...formData, phone: val })}
                defaultDial="+254"
                label="Phone"
                inputId="phone"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LandlordCreationForm({ isOpen, onClose, onSuccess, userData }: { isOpen: boolean; onClose: () => void; onSuccess: (data: any) => void; userData: any }): ReactElement {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    business_name: "",
    company_registration_number: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Only send business-related fields
      const response = await api.put(`/landlords/${userData.landlord.id}/`, formData);
      toast({
        variant: "default",
        title: "Success!",
        description: "Landlord profile updated successfully",
        duration: 3000
      });
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.response?.data?.message || "Failed to update landlord"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Landlord Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_registration_number">Company Registration Number</Label>
              <Input
                id="company_registration_number"
                value={formData.company_registration_number}
                onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Landlord'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PropertyAssignmentForm({ isOpen, onClose, landlordData }: { isOpen: boolean; onClose: () => void; landlordData: any }): ReactElement {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    property_type: "APARTMENT"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/properties/', {
        ...formData,
        landlord: landlordData.id
      });
      toast({
        title: "Success",
        description: "Property assigned to landlord successfully"
      });
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to assign property"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Property - Step 3</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>Skip</Button>
            <Button type="submit" disabled={isLoading}>Assign Property</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LandlordOnboardingFlow({ onClose, onRefresh }: { onClose: () => void; onRefresh?: () => void }): ReactElement {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>(null);
  const [landlordData, setLandlordData] = useState<any>(null);
  const { toast } = useToast();

  const handleClose = () => {
    setStep(1);
    setUserData(null);
    setLandlordData(null);
    onClose();
  };

  const handleUserCreated = async (data: any) => {
    if (!data.user || !data.landlord) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid user data received"
      });
      return;
    }
    setUserData(data);
    setStep(2);
    // Trigger landlord table refresh immediately after successful creation toast
    onRefresh?.();
  };

  const handleLandlordCreated = (data: any) => {
    setLandlordData(data);
    setStep(3);
    // Also refresh after landlord profile update in case table displays business fields
    onRefresh?.();
  };

  return (
    <>
      {step === 1 && (
        <UserCreationForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleUserCreated}
        />
      )}
      {step === 2 && userData && (
        <LandlordCreationForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleLandlordCreated}
          userData={userData}
        />
      )}
      {step === 3 && landlordData && (
        <PropertyAssignmentForm
          isOpen={true}
          onClose={handleClose}
          landlordData={landlordData}
        />
      )}
    </>
  );
}