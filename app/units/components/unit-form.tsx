import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Unit, Property } from "../types"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"

type UnitStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'

interface UnitFormProps {
  isOpen: boolean
  onClose: () => void
  unit?: Unit
  onSuccess: () => void
}

export function UnitForm({ isOpen, onClose, unit, onSuccess }: UnitFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [formData, setFormData] = useState({
    unit_number: unit?.unit_number || "",
    unit_type: unit?.unit_type || "2BR/2BA/OK",
    unit_status: (unit?.unit_status || "VACANT") as UnitStatus,
    floor: unit?.floor || 1,
    size: unit?.size || "",
    rent: unit?.rent || "",
    deposit: unit?.deposit || "",
    amenities: unit?.amenities || [],
    features: unit?.features || { parking_spots: 0, storage_unit: "" },
    property_id: unit?.property.id ? unit.property.id.toString() : ""
  })

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
  }, [toast])  // Add toast here

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
  
    try {
      if (unit) {
        await api.put(`/units/${unit.id}/`, formData)
      } else {
        await api.post(`/properties/${formData.property_id}/units/`, formData)
      }
      toast({
        title: "Success",
        description: `Unit ${unit ? 'updated' : 'created'} successfully`
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving unit:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save unit"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit' : 'Add'} Unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label>Property</label>
              <Select
                value={formData.property_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                disabled={!!unit}
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
            <div className="space-y-2">
              <label>Unit Number</label>
              <Input
                value={formData.unit_number}
                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Unit Type</label>
              <Select
                value={formData.unit_type}
                onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
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
              <label>Status</label>
              <Select
                value={formData.unit_status}
                onValueChange={(value: UnitStatus) => setFormData({ ...formData, unit_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACANT">Vacant</SelectItem>
                  {/* Removed the Occupied option as requested */}
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label>Floor</label>
              <Input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Size (sq ft)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Rent (KES)</label> {/* Changed from ($) to (KES) */}
              <Input
                type="number"
                step="0.01"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Deposit (KES)</label> {/* Changed from ($) to (KES) */}
              <Input
                type="number"
                step="0.01"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}