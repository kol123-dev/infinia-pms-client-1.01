import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Property } from "../types"
import { Badge } from "@/components/ui/badge"
import { Building, MapPin, Users, DollarSign, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import api from "@/lib/axios"
import Image from 'next/image';

// Add this new import to fix the errors
import { formatCurrency } from "@/lib/utils";

interface PropertyDetailsProps {
  property: Property
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
}

export function PropertyDetails({ property, isOpen, onClose, onDelete }: PropertyDetailsProps) {
  console.log('Property data:', property);
  console.log('Landlord data:', property.landlord);
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
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl w-full h-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 flex flex-col gap-4"> {/* Added flex flex-col gap-4 for vertical stacking and spacing */}
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">{property.name}</DialogTitle>
          <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground mt-2">
            <Badge variant="secondary" className="text-xs sm:text-sm">{property.property_type}</Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">{property.building_type}</Badge>
          </div>
        </DialogHeader>
    
        {/* Property Image */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
          <Image
            src="/placeholder.svg"
            alt={property.name || ''}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Location Information - Added mt-4 for spacing */}
        <div className="bg-muted/50 p-4 rounded-lg mt-4"> {/* Added mt-4 */}
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg">{property.location.address}</span>
          </div>
        </div>
    
        {/* Property Management - Added mt-4 for spacing */}
        <div className="grid gap-4 mt-4"> {/* Added mt-4 */}
          <h3 className="text-lg font-semibold text-blue-600">Property Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">Landlord</h4>
              <p className="mt-1">{property.landlord?.user?.full_name || 'Not assigned'}</p>
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
          <h3 className="text-lg font-semibold text-blue-600">Units Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-blue-600">{property.units.summary.total}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Total Units</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-blue-600">{property.units.summary.occupied}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Occupied</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-blue-600">{property.units.summary.vacant}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Vacant</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-blue-600">{property.units.summary.underMaintenance}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Under Maintenance</p>
            </div>
          </div>
        </div>

        {/* Unit Types */}
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-blue-600">Unit Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(property.units.distribution).map(([type, count]) => (
              <div key={type} className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">{type}</h4>
                <p className="text-2xl font-bold mt-1 text-blue-600">{count.toString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-blue-600">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="h-5 w-5 text-muted-foreground flex items-center justify-center text-[10px] font-bold">KES</span>
                <h4 className="text-sm font-medium text-muted-foreground">Last Monthly Revenue</h4>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-600">
                {formatCurrency(property.financials?.summary?.lastMonthlyRevenue ?? 0)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="h-5 w-5 text-muted-foreground flex items-center justify-center text-[10px] font-bold">KES</span>
                <h4 className="text-sm font-medium text-muted-foreground">Potential Monthly Revenue</h4>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-600">
                {formatCurrency(property.financials?.summary?.potentialMonthlyRevenue ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* M-Pesa Configuration */}
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-600">M-Pesa Configuration</h3>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Paybill/Till Number</h4>
                <p className="text-lg font-semibold mt-1">{property.mpesa_config?.shortcode || 'Not configured'}</p>
              </div>
              <Badge variant={property.mpesa_config?.is_active ? "default" : "secondary"}>
                {property.mpesa_config?.is_active ? 'Active' : 'Inactive'}
              </Badge>
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

        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Property
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}