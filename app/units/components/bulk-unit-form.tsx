import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Property } from "../types"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"

type UnitStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'

interface BulkUnitFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UnitData {
  unit_number: string
  unit_type: string
  unit_status: UnitStatus
  floor: number
  size: string
  rent: string
  deposit: string
  amenities: string[]
  features: {
    parking_spots: number
    storage_unit: string
  }
}

export function BulkUnitForm({ isOpen, onClose, onSuccess }: BulkUnitFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [units, setUnits] = useState<UnitData[]>([{
    unit_number: "",
    unit_type: "2BR/2BA/OK",
    unit_status: "VACANT",
    floor: 1,
    size: "",
    rent: "",
    deposit: "",
    amenities: ["balcony", "parking"],
    features: { parking_spots: 1, storage_unit: "" }
  }])

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/properties/')
        setProperties(response.data.results || [])
      } catch (error) {
        console.error('Error fetching properties:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load properties"
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProperties()
  }, [toast])  // Added toast here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a property"
      })
      return
    }
    setIsLoading(true)

    try {
      await api.post(`/properties/${selectedPropertyId}/units/bulk/`, { units })
      toast({
        title: "Success",
        description: `${units.length} units created successfully`
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating units:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create units"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index))
  }

  const handleAddUnit = () => {
    setUnits([...units, {
      unit_number: "",
      unit_type: "2BR/2BA/OK",
      unit_status: "VACANT",
      floor: 1,
      size: "",
      rent: "",
      deposit: "",
      amenities: ["balcony", "parking"],
      features: { parking_spots: 1, storage_unit: "" }
    }])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Multiple Units</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label>Property</label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {units.map((unit, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Unit {index + 1}</h3>
                  {units.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveUnit(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Unit Number</label>
                    <Input
                      value={unit.unit_number}
                      onChange={(e) => {
                        const newUnits = [...units]
                        newUnits[index] = { ...unit, unit_number: e.target.value }
                        setUnits(newUnits)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Unit Type</label>
                    <Select
                      value={unit.unit_type}
                      onValueChange={(value) => {
                        const newUnits = [...units]
                        newUnits[index] = { ...unit, unit_type: value }
                        setUnits(newUnits)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2BR/2BA/OK">2BR/2BA/OK</SelectItem>
                        <SelectItem value="2BR/3BA/CK">2BR/3BA/CK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label>Floor</label>
                    <Input
                      type="number"
                      value={unit.floor}
                      onChange={(e) => {
                        const newUnits = [...units]
                        newUnits[index] = { ...unit, floor: parseInt(e.target.value) }
                        setUnits(newUnits)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Size (sq ft)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unit.size}
                      onChange={(e) => {
                        const newUnits = [...units]
                        newUnits[index] = { ...unit, size: e.target.value }
                        setUnits(newUnits)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Rent ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unit.rent}
                      onChange={(e) => {
                        const newUnits = [...units]
                        newUnits[index] = { ...unit, rent: e.target.value }
                        setUnits(newUnits)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Deposit ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unit.deposit}
                      onChange={(e) => {
                        const newUnits = [...units]
                        newUnits[index] = { ...unit, deposit: e.target.value }
                        setUnits(newUnits)
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleAddUnit}>
                Add Another Unit
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Units'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}