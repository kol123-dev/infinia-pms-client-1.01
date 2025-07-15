import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Property } from "../types"
import { Badge } from "@/components/ui/badge"
import { Building, MapPin, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import api from "@/lib/axios"

interface PropertyDetailsProps {
  property: Property
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
}

export function PropertyDetails({ property, isOpen, onClose, onDelete }: PropertyDetailsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  
  const handleDelete = async () => {
    if (deleteText.toLowerCase() !== 'delete') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please type 'delete' to confirm",
      })
      return
    }

    try {
      await api.delete(`/properties/${property.id}/`)
      toast({
        title: "Success",
        description: "Property deleted successfully",
      })
      onDelete?.()
      onClose()
    } catch (error) {
      console.error("Error deleting property:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete property",
      })
    }
  }

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">Delete Property</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Are you sure you want to delete <strong>{property.name}</strong>? This action cannot be undone.</p>
            <p className="text-sm text-muted-foreground mb-2">Type 'delete' to confirm:</p>
            <Input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="mb-4"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteText.toLowerCase() !== 'delete'}
            >
              Delete Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">{property.name}</DialogTitle>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{property.property_type}</Badge>
              <Badge variant="outline">{property.building_type}</Badge>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Property
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Property Image */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src="/placeholder.svg"
              alt={property.name}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* Location Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg">{property.location.address}</span>
            </div>
          </div>

          {/* Property Management */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Property Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">Landlord</h4>
                <p className="mt-1">{property.landlord?.name || 'Not assigned'}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">Agent</h4>
                <p className="mt-1">{property.agent?.name || 'Not assigned'}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">Property Manager</h4>
                <p className="mt-1">{property.property_manager?.name || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          {/* Units Information */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Units Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{property.units.summary.total}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total Units</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{property.units.summary.occupied}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Occupied</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{property.units.summary.vacant}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Vacant</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{property.units.summary.underMaintenance}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Under Maintenance</p>
              </div>
            </div>
          </div>

          {/* Unit Types */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Unit Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(property.units.distribution).map(([type, count]) => (
                <div key={type} className="p-4 border rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">{type}</h4>
                  <p className="text-2xl font-bold mt-1">{count.toString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">Actual Monthly Revenue</h4>
                </div>
                <p className="text-2xl font-bold mt-2">
                  ${property.financials.summary.actualMonthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">Potential Monthly Revenue</h4>
                </div>
                <p className="text-2xl font-bold mt-2">
                  ${property.financials.summary.potentialMonthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Description</h3>
              <div className="p-4 border rounded-lg">
                <p className="text-muted-foreground">{property.description}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}