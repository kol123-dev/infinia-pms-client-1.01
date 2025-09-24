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
  landlord_id: number | null
  business_name: string
  user: {
    id: number
    email: string
    full_name: string
  }
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
    building_type: property?.building_type || "STOREY",
    description: property?.description || "",
    location: {
      address: property?.location?.address || "",
      coordinates: {
        lat: property?.location?.coordinates?.lat || null,
        lng: property?.location?.coordinates?.lng || null
      }
    },
    landlord_id: property?.landlord?.id || null,
    property_manager_id: property?.property_manager?.id || null,
    units: {
      total: property?.units?.summary?.total || 0,
      occupied: property?.units?.summary?.occupied || 0,
      vacant: property?.units?.summary?.vacant || 0,
      underMaintenance: property?.units?.summary?.underMaintenance || 0
    }
    // Removed financials (system-calculated now)
  })

  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([])

  useEffect(() => {
    // Fetch available landlords and property managers
    const fetchData = async () => {
      try {
        const [landlordsRes, managersRes] = await Promise.all([
          api.get('/landlords/'), // The backend will filter landlords based on the agent's token
          api.get('/property-managers/')
        ])
        // Log the response to see the structure
        console.log('Landlords response:', landlordsRes.data)
        // Make sure we're accessing the correct data structure
        setLandlords(landlordsRes.data.results || landlordsRes.data)
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
      const finalData = {
        name: formData.name,
        property_type: formData.property_type,
        building_type: formData.building_type,
        description: formData.description,
        address: formData.location.address,
        latitude: formData.location.coordinates.lat ?? 0,
        longitude: formData.location.coordinates.lng ?? 0,
        landlord: formData.landlord_id || null,
        total_units: Number(formData.units.total) || 0,
        occupied_units: Number(formData.units.occupied) || 0,
        vacant_units: Number(formData.units.vacant) || 0,
        under_maintenance_units: Number(formData.units.underMaintenance) || 0,
        // Removed potential_monthly_revenue and actual_monthly_revenue
      };
  
      console.log('Request payload:', finalData);
  
      let response;
      if (property) {
        response = await api.put(`/properties/${property.id}/`, finalData);
      } else {
        response = await api.post('/properties/', finalData);
      }
      console.log('Response:', response.data);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving property:', error.response?.data || error);
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
      } else if (parent === 'units') {  // Removed 'financials' from the check
        // Ensure numeric values for units
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

              {/* Property Management section */}
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
                            {landlord.user.full_name}
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