import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    frequency: 'monthly', // Default to monthly as per your request
    amount_type: 'unit_rent',
    fixed_amount: undefined,
    tenantMode: 'all', // New: 'all' | 'all_except'
    excludedTenants: [], // New: for exclusions
    sendDay: 25, // New: default 25
    sendTime: '09:00', // New: default time
    dueDay: 5, // New: default 5
    dueTime: '23:59', // New: default time
    sendSms: true, // New: default true
  });
  const [tenantSearch, setTenantSearch] = useState(''); // New: for searching in except mode

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

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

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => axios.get('/properties/').then(res => res.data.results || []),
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants', formData.property],
    queryFn: () => axios.get(`/tenants/?current_unit__property=${formData.property}`).then(res => res.data.results || []),
    enabled: !!formData.property,
  });

  const handleExcludedTenantChange = (tenantId: string, checked: boolean) => {
    setFormData(prev => {
      const newExcluded = checked
        ? [...(prev.excludedTenants ?? []), tenantId]
        : (prev.excludedTenants ?? []).filter(id => id !== tenantId);
      return { ...prev, excludedTenants: newExcluded };
    });
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.user?.full_name?.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.property || !formData.frequency || !formData.amount_type ||
        (formData.tenantMode === 'all_except' && (formData.excludedTenants ?? []).length === 0)) {
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
            <RadioGroup
              value={formData.tenantMode}
              onValueChange={v => setFormData({ ...formData, tenantMode: v as 'all' | 'all_except', excludedTenants: [] })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Tenants in Property</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_except" id="all_except" />
                <Label htmlFor="all_except">All Tenants in Property except</Label>
              </div>
            </RadioGroup>
            {formData.tenantMode === 'all_except' && formData.property && (
              <div className="space-y-2">
                <Input
                  placeholder="Search tenants to exclude..."
                  value={tenantSearch}
                  onChange={e => setTenantSearch(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto space-y-2 pl-4">
                  {filteredTenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tenants found.</p>
                  ) : (
                    filteredTenants.map(tenant => (
                      <div key={tenant.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(formData.excludedTenants ?? []).includes(tenant.id.toString())}
                          onCheckedChange={checked => handleExcludedTenantChange(tenant.id.toString(), checked as boolean)}
                        />
                        <label className="text-sm">{tenant.user?.full_name || 'Unknown'}</label>
                      </div>
                    ))
                  )}
                </div>
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

          {/* New: Recurring Date Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Invoice Send Day (e.g., 25th)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={formData.sendDay ?? 25}
                onChange={e => setFormData({ ...formData, sendDay: parseInt(e.target.value) || 25 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Send Time</Label>
              <Input
                type="time"
                value={formData.sendTime ?? '09:00'}
                onChange={e => setFormData({ ...formData, sendTime: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Due Day (e.g., 5th next month)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={formData.dueDay ?? 5}
                onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Due Time</Label>
              <Input
                type="time"
                value={formData.dueTime ?? '23:59'}
                onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
              />
            </div>
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

          {/* New: SMS Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.sendSms ?? true}
              onCheckedChange={checked => setFormData({ ...formData, sendSms: checked as boolean })}
            />
            <label className="text-sm">Send SMS Notification</label>
          </div>
        </div>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
};