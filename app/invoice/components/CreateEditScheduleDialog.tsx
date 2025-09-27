import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScheduleFormData } from '@/types/invoice';
import axios from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => void;
  initialData?: ScheduleFormData;
}

export const CreateEditScheduleDialog: React.FC<DialogProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ScheduleFormData>(initialData || {
    property: '',
    tenants: [],
    frequency: '',
    amount_type: 'unit_rent',
    fixed_amount: undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Fetch properties
  // Add these interfaces near the top (after imports)
  interface Property {
    id: number;
    name: string;
  }
  
  interface Tenant {
    id: number;
    user?: {
      full_name?: string;
    };
  }
  
  // Update the properties query
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => axios.get('/properties/').then(res => res.data.results || []),
  });
  
  // Update the tenants query
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants', formData.property],
    queryFn: () => axios.get(`/tenants/?current_unit__property=${formData.property}`).then(res => res.data.results || []),
    enabled: !!formData.property,
  });

  const handleTenantChange = (tenantId: string, checked: boolean) => {
    setFormData(prev => {
      const newTenants = checked
        ? [...(prev.tenants as string[]), tenantId]
        : (prev.tenants as string[]).filter(id => id !== tenantId);
      return { ...prev, tenants: newTenants };
    });
  };

  const handleAllTenantsChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, tenants: checked ? 'all' : [] }));
  };

  const handleSubmit = () => {
    if (!formData.property || !formData.frequency || !formData.amount_type || (formData.tenants !== 'all' && (formData.tenants as string[]).length === 0)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
      return;
    }
    if (formData.amount_type === 'fixed' && !formData.fixed_amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a fixed amount.' });
      return;
    }
    onSubmit(formData);
    onClose();
  };

  const isAllTenants = formData.tenants === 'all';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="property">Property</Label>
            <Select value={formData.property} onValueChange={v => setFormData({ ...formData, property: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(prop => (
                  <SelectItem key={prop.id} value={prop.id.toString()}>{prop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tenants</Label>
            <div className="flex items-center space-x-2">
              <Checkbox checked={isAllTenants} onCheckedChange={handleAllTenantsChange} />
              <label className="text-sm">All Tenants in Property</label>
            </div>
            {!isAllTenants && formData.property && (
              <div className="max-h-40 overflow-y-auto space-y-2 pl-4">
                {tenants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tenants found for this property.</p>
                ) : (
                  tenants.map(tenant => (
                    <div key={tenant.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={(formData.tenants as string[]).includes(tenant.id.toString())}
                        onCheckedChange={checked => handleTenantChange(tenant.id.toString(), checked as boolean)}
                      />
                      <label className="text-sm">{tenant.user?.full_name || 'Unknown'}</label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={formData.frequency} onValueChange={v => setFormData({ ...formData, frequency: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount_type">Amount Type</Label>
            <Select value={formData.amount_type} onValueChange={v => setFormData({ ...formData, amount_type: v as 'unit_rent' | 'fixed' })}>
              <SelectTrigger>
                <SelectValue placeholder="Select amount type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unit_rent">Unit Rent</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.amount_type === 'fixed' && (
            <div className="grid gap-2">
              <Label htmlFor="fixed_amount">Fixed Amount</Label>
              <Input
                id="fixed_amount"
                type="number"
                value={formData.fixed_amount ?? ''}
                onChange={e => setFormData({ ...formData, fixed_amount: parseFloat(e.target.value) || undefined })}
                placeholder="Enter amount"
              />
            </div>
          )}
        </div>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
};