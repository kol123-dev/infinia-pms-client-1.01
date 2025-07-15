export interface Property {
  id: number
  property_id: string | null
  name: string
  property_type: string
  building_type: string
  description: string
  location: {
    address: string
    coordinates: {
      lat: number | null
      lng: number | null
    }
  }
  landlord: {
    id: number
    name: string
    business_name?: string
  } | null
  agent: {
    id: number
    name: string
  } | null
  property_manager: {
    id: number
    name: string
  } | null
  units: {
    summary: {
      total: number
      occupied: number
      vacant: number
      underMaintenance: number
      occupancyRate: number
    }
    distribution: Record<string, any>
    metrics: {
      averageRent: number
      averageOccupancyDuration: string | null
      expiringLeases: number
    }
  }
  financials: {
    summary: {
      potentialMonthlyRevenue: number
      actualMonthlyRevenue: number
      occupancyRate: number
      revenueEfficiency: number
    }
    revenueHistory: Array<{
      month: string
      amount: number
    }>
    unitTypeRevenue: Record<string, any>
  }
}

export interface PropertiesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Property[]
}