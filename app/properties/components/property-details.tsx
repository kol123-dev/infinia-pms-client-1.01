// top-level imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Property } from "../types"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Building, MapPin, Users, DollarSign, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import api from "@/lib/axios"
import Image from 'next/image';
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyDetailsProps {
  property: Property
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
}

export function PropertyDetails({ property, isOpen, onClose, onDelete }: PropertyDetailsProps) {
  const router = useRouter()
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

  // Sleek, compact modal content
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] p-0 gap-0">
        <ScrollArea className="h-full max-h-[90vh]">
          {/* Sticky header keeps context while scrolling */}
          <DialogHeader className="sticky top-0 z-10 px-6 py-4 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
                  {property.name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">{property.property_type}</Badge>
                  <Badge variant="outline" className="text-xs">{property.building_type}</Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Banner image */}
            <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden relative">
              <Image
                src="/placeholder.svg"
                alt={property.name || ''}
                fill
                className="object-cover"
              />
            </div>

            {/* Address pill */}
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.location?.address}</span>
              </div>
            </div>
  
            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => router.push(`/units?status=all&property=${property.id}`)}
                aria-label="View all units"
                className="rounded-lg border p-3 text-left w-full hover:bg-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-blue-600">
                    {property.units?.summary?.total}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Total Units</p>
              </button>
  
              <button
                type="button"
                onClick={() => router.push(`/units?status=occupied&property=${property.id}`)}
                aria-label="View occupied units"
                className="rounded-lg border p-3 text-left w-full hover:bg-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-blue-600">
                    {property.units?.summary?.occupied}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Occupied Units</p>
              </button>
  
              <button
                type="button"
                onClick={() => router.push(`/units?status=vacant&property=${property.id}`)}
                aria-label="View vacant units"
                className="rounded-lg border p-3 text-left w-full hover:bg-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-blue-600">
                    {property.units?.summary?.vacant}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Vacant Units</p>
              </button>
            </div>
  
            {/* Financials (compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold text-muted-foreground">KES</span>
                  <span className="text-xs text-muted-foreground">Last Month</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-green-600">
                  {formatCurrency(property.financials?.summary?.lastMonthlyRevenue ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold text-muted-foreground">KES</span>
                  <span className="text-xs text-muted-foreground">Potential / Month</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-green-600">
                  {formatCurrency(property.financials?.summary?.potentialMonthlyRevenue ?? 0)}
                </p>
              </div>
            </div>
  
            {/* Management (minimal list) */}
            <div className="rounded-lg border p-3 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Management</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Landlord</span>
                <span className="font-medium">{property.landlord?.user?.full_name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agent</span>
                <span className="font-medium">{property.agent?.name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Property Manager</span>
                <span className="font-medium">{property.property_manager?.name || 'Not assigned'}</span>
              </div>
            </div>
  
            {/* Unit types (minimal chips) */}
            {property.units?.distribution && (
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Unit Types</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(property.units.distribution).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
  
            {/* M-Pesa config */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">M‑Pesa</h3>
                  <p className="text-sm font-semibold">
                    {property.mpesa_config?.shortcode || 'Not configured'}
                  </p>
                </div>
                <Badge variant={property.mpesa_config?.is_active ? "default" : "secondary"} className="text-xs">
                  {property.mpesa_config?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
  
            {/* Description (muted) */}
            {property.description && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">{property.description}</p>
              </div>
            )}
  
            <DialogFooter className="px-0 pt-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Property
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}