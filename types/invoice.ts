export interface Invoice {
  id?: number; // Made optional to fix 'id' errors (even if usually present)
  invoice_number?: string; // Added to fix 'invoice_number'
  tenant_name?: string; // Existing, now optional
  property_name?: string; // Existing, now optional
  amount?: number; // Made optional to fix 'amount' (even if usually present)
  status: 'paid' | 'unpaid' | 'pending' | 'overdue' | 'sent'; // Expanded
  due_date: string;
  paid_date?: string | null;
  payment_method?: string | null;
  tenant?: { // Added nested to fix 'tenant'
    id?: number;
    user?: {
      full_name?: string;
      email?: string;
    };
  };
  unit?: { // Added nested to fix 'unit'
    unit_number?: string;
    property?: {
      name?: string;
    };
  };
}

export interface Schedule {
  id: number;
  property: string;
  tenants: string[]; // or appropriate type
  frequency: string;
  amount_type?: string; // Add this as optional if it exists in backend data
  // Add other fields as optional if needed
}

export interface ScheduleFormData {
  id?: number;
  property: string;
  tenants: string[] | 'all';
  frequency: string;
  amount_type: 'unit_rent' | 'fixed';
  fixed_amount?: number;
  tenantMode: 'all' | 'all_except'; // New: for tenant selection mode
  excludedTenants: string[]; // New: array of excluded tenant IDs (as strings)
  sendDay: number; // New: day to send invoice (e.g., 25)
  sendTime: string; // New: time to send (e.g., '09:00')
  dueDay: number; // New: due day (e.g., 5)
  dueTime: string; // New: due time (e.g., '23:59')
  sendSms: boolean; // New: whether to send SMS
}