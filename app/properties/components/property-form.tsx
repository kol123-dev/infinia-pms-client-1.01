import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { Property } from "../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PropertyFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  property?: Property
}

interface Landlord {
  id: number
  business_name: string
  name: string
  email: string
}

interface Agent {
  id: number
  user: {
    id: number
    email: string
    full_name: string
    phone: string | null
    role: string
    is_active: boolean
  }
}

interface PropertyManager {
  id: number
  name: string
  email: string
}

export function PropertyForm({ isOpen, onClose, onSuccess, property }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: property?.name || "",
    property_type: property?.property_type || "RESIDENTIAL",
    building_type: property?.building_type || "STOREY",  // This is now correct as it matches backend
    description: property?.description || "",
    location: {
      address: property?.location?.address || "",
      coordinates: {
        lat: property?.location?.coordinates?.lat || null,
        lng: property?.location?.coordinates?.lng || null
      }
    },
    landlord_id: property?.landlord?.id || null,
    agent_id: property?.agent?.id || null,
    property_manager_id: property?.property_manager?.id || null,
    units: {
      total: property?.units?.total || 0,
      occupied: property?.units?.occupied || 0,
      vacant: property?.units?.vacant || 0,
      underMaintenance: property?.units?.underMaintenance || 0
    },
    financials: {
      potentialMonthlyRevenue: property?.financials?.potentialMonthlyRevenue || 0,
      actualMonthlyRevenue: property?.financials?.actualMonthlyRevenue || 0
    }
  })

  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([])

  useEffect(() => {
    // Fetch available landlords, agents, and property managers
    const fetchData = async () => {
      try {
        const [landlordsRes, agentsRes, managersRes] = await Promise.all([
          api.get('/landlords/'),
          api.get('/agents/'),
          api.get('/property-managers/')
        ])
        setLandlords(landlordsRes.data.results)
        setAgents(agentsRes.data.results)
        setPropertyManagers(managersRes.data.results)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare the data according to PropertyWriteSerializer format
      const finalData = {
        name: formData.name,
        property_type: formData.property_type,
        building_type: formData.building_type,
        description: formData.description,
        address: formData.location.address,
        // Default to 0 if coordinates are null
        latitude: formData.location.coordinates.lat ?? 0,
        longitude: formData.location.coordinates.lng ?? 0,
        landlord: formData.landlord_id || null,
        agent: formData.agent_id || null,
        total_units: Number(formData.units.total) || 0,
        occupied_units: Number(formData.units.occupied) || 0,
        vacant_units: Number(formData.units.vacant) || 0,
        under_maintenance_units: Number(formData.units.underMaintenance) || 0,
        potential_monthly_revenue: Number(formData.financials.potentialMonthlyRevenue) || 0,
        actual_monthly_revenue: Number(formData.financials.actualMonthlyRevenue) || 0
      };
  
      if (property) {
        await api.put(`/properties/${property.id}/`, finalData);
      } else {
        await api.post('/properties/', finalData);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving property:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
}

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => {
      if (typeof prev[parent] !== 'object' || prev[parent] === null) {
        return prev;
      }
      
      // Handle numeric fields
      let processedValue = value;
      if (typeof value === 'string' && value.trim() === '') {
        // Convert empty string to 0 for numeric fields
        processedValue = 0;
      } else if (parent === 'units' || parent === 'financials') {
        // Ensure numeric values for units and financials
        processedValue = Number(value) || 0;
      }

      return {
        ...prev,
        [parent]: {
          ...prev[parent] as object,
          [field]: processedValue
        }
      };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "Add New Property"}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Basic Property Information */}
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => handleChange("property_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                      <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="building_type">Building Type</Label>
                  <Select
                    value={formData.building_type}
                    onValueChange={(value) => handleChange("building_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOREY">Storey</SelectItem>
                      <SelectItem value="GROUND_FLOOR">Ground Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.location.address}
                  onChange={(e) => handleNestedChange("location", "address", e.target.value)}
                  required
                />
              </div>

              {/* Property Management */}
              <div className="space-y-4">
                <h3 className="font-medium">Property Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landlord">Landlord</Label>
                    <Select
                      value={formData.landlord_id?.toString()}
                      onValueChange={(value) => handleChange("landlord_id", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select landlord" />
                      </SelectTrigger>
                      <SelectContent>
                        {landlords.map((landlord) => (
                          <SelectItem key={landlord.id} value={landlord.id.toString()}>
                            {landlord.business_name || landlord.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="agent">Agent</Label>
                    <Select
                      value={formData.agent_id?.toString()}
                      onValueChange={(value) => handleChange("agent_id", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="property_manager">Property Manager</Label>
                    <Select
                      value={formData.property_manager_id?.toString()}
                      onValueChange={(value) => handleChange("property_manager_id", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id.toString()}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Units Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Units Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_units">Total Units</Label>
                    <Input
                      id="total_units"
                      type="number"
                      value={formData.units.total}
                      onChange={(e) => handleNestedChange("units", "total", parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupied_units">Occupied Units</Label>
                    <Input
                      id="occupied_units"
                      type="number"
                      value={formData.units.occupied}
                      onChange={(e) => handleNestedChange("units", "occupied", parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vacant_units">Vacant Units</Label>
                    <Input
                      id="vacant_units"
                      type="number"
                      value={formData.units.vacant}
                      onChange={(e) => handleNestedChange("units", "vacant", parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance_units">Units Under Maintenance</Label>
                    <Input
                      id="maintenance_units"
                      type="number"
                      value={formData.units.underMaintenance}
                      onChange={(e) => handleNestedChange("units", "underMaintenance", parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="potential_revenue">Potential Monthly Revenue</Label>
                    <Input
                      id="potential_revenue"
                      type="number"
                      value={formData.financials.potentialMonthlyRevenue}
                      onChange={(e) => handleNestedChange("financials", "potentialMonthlyRevenue", parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="actual_revenue">Actual Monthly Revenue</Label>
                    <Input
                      id="actual_revenue"
                      type="number"
                      value={formData.financials.actualMonthlyRevenue}
                      onChange={(e) => handleNestedChange("financials", "actualMonthlyRevenue", parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="h-32"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              {property ? "Update Property" : "Add Property"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}