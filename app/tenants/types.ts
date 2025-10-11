// Export the interfaces that are used in Tenant interface
export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: string
  is_active: boolean
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface Unit {
  id: number
  unit_id: string
  unit_number: string
  type: string
  unit_status: string
  property: {
    id: number
    property_id: string
    name: string
    address: string
  }
  rent: number  // Add this line
}

export interface Landlord {
  id: number
  business_name: string
  name: string
  email: string
}

export interface Tenant {
  id: number
  tenant_id: string
  user: User | null
  landlord: Landlord | null
  current_unit: Unit | null
  phone: string | null
  date_of_birth: string | null
  move_in_date: string | null
  move_out_date: string | null
  rent_amount: number | null
  payment_due_day: number | null
  balance_due: number
  status: 'ACTIVE' | 'PAST' | 'EVICTED' | 'APPLICANT'
  emergency_contact: EmergencyContact | null
  notes: string | null
  created_at: string
  lease_agreement_url: string | null
  id_verification_url: string | null
  proof_of_income_url: string | null
  lease_start_date?: string | null
  lease_end_date?: string | null
  last_unit?: {
    id: number;
    unit_number: string;
    property?: {
      name: string;
    };
  };
}

export interface TenantsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Tenant[]
}