import { Expense } from "@/hooks/useExpenses"

export interface FinancialData {
  month: string
  revenue: number
  expenses: number
  profit: number
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