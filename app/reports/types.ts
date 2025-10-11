import { Expense } from "@/hooks/useExpenses"

export interface FinancialData {
  month: string
  revenue: number
  expenses: number
  profit: number
  taxable_income?: number
  net_profit?: number
}

export interface OccupancyData {
  property: string
  occupied: number
  total: number
  rate: number
}

export interface PieData {
  name: string
  value: number
  color: string
  [key: string]: any // Add index signature for string keys
}

// Update ChartConfig to match the expected type
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
    icon?: React.ComponentType
  }
}

export interface Property {
  id: string
  name: string
  units?: any[]
}

export interface Tenant {
  id: string
  user?: {
    full_name?: string
    email?: string
    phone?: string
  }
  // Add API 'status' to align with backend responses
  status?: string
  tenant_status?: string
  current_unit?: {
    unit_number?: string
    property?: {
      name?: string
    }
    rent?: string
  }
  property_name?: string
  move_in_date?: string
  move_out_date?: string
  lease_start_date?: string
  lease_end_date?: string
  rent_amount?: number
  balance?: number
}

export interface Payment {
  id: string
  amount: number
  date: string
  status: string
}

export type ReportType = 'financial' | 'occupancy' | 'expense' | 'tenant'
export type TimeRange = '1month' | '3months' | '6months' | '1year'

export interface UnitForReport {
  id: number
  unit_id?: string
  unit_number: string
  property: { name: string }
  unit_type: string
  unit_status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | string
  rent: number | string
  current_tenant?: {
    user: {
      full_name: string
      email?: string
      phone?: string
    }
  }
  tenant_history?: Array<{
    tenant: {
      user: {
        full_name: string
      }
    }
    start_date: string
    end_date: string | null
  }>
}