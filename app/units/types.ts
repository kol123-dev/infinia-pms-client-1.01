export interface UnitFeatures {
  parking_spots: number
  storage_unit: boolean
}

export interface User {
  id: number
  full_name: string
  email: string
  phone: string
}

export interface Property {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip_code: string
}

export interface Tenant {
  id: number
  user: User
  lease_start_date: string
  lease_end_date: string
}

export interface Unit {
  id: number
  unit_id: string
  unit_number: string
  property: Property
  current_tenant?: Tenant
  unit_type: string
  unit_status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
  floor: number
  size: number
  rent: number
  deposit: number
  amenities: string[]
  features: UnitFeatures
  lease_start_date?: string
  lease_end_date?: string
  lease_status?: string
  created_at: string
  updated_at: string
}