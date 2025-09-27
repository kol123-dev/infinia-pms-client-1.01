import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScheduleFormData } from '@/types/invoice'; // Single import, no local declaration

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => void;
  initialData?: ScheduleFormData;
}

export const CreateEditScheduleDialog: React.FC<DialogProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<ScheduleFormData>(initialData || {
    property: '',
    tenants: [],
    frequency: '',
    amount_type: 'unit_rent',
  });

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        </DialogHeader>
        {/* Add your form fields here, e.g., Inputs/Selects updating formData */}
        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
};