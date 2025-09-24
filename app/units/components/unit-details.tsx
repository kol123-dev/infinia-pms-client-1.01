import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Unit } from "../types"
import { Building2, Bed, Ruler, CreditCard, PiggyBank, Car, Box, User, Mail, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// Import these at the top if not already (from lucide-react)
import { Trash2, X, Edit as EditIcon } from "lucide-react"

interface UnitDetailsProps {
  unit: Unit
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void  // New prop for triggering delete confirmation
}

export function UnitDetails({ unit, isOpen, onClose, onEdit, onDelete }: UnitDetailsProps) {  // Updated props
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0">
        <ScrollArea className="h-full max-h-[calc(90vh-4rem)]">
          <div className="p-6 space-y-6">  
            <DialogHeader className="px-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-medium">
                    Unit {unit.unit_number}
                  </DialogTitle>
                  <div className="flex items-center text-muted-foreground">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>{unit.property.name}</span>
                  </div>
                </div>
                <Badge
                  variant={unit.unit_status === 'VACANT' ? 'default' : 
                          unit.unit_status === 'OCCUPIED' ? 'secondary' : 'destructive'}
                  className="text-sm"
                >
                  {unit.unit_status}
                </Badge>
              </div>
            </DialogHeader>
            
            <Separator />
            
            <div className="space-y-4">  
              <Card className="border-0">
                <CardContent className="grid sm:grid-cols-2 grid-cols-1 gap-6 p-6">
                  <div className="flex items-center space-x-3">
                    <Bed className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Type</p>
                      <p className="text-base">{unit.unit_type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floor</p>
                      <p className="text-base">{unit.floor}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Ruler className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="text-base">{unit.size} sq ft</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rent</p>
                      <p className="text-base">KES {unit.rent}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <PiggyBank className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Deposit</p>
                      <p className="text-base">KES {unit.deposit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {unit.amenities.map((amenity) => (
                    <Badge 
                      key={amenity} 
                      variant="outline"
                      className="text-sm"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <Card className="border-0">
                <CardContent className="p-4 space-y-2">  
                  <h4 className="text-sm font-medium">Features</h4>
                  <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                    <div className="flex items-center space-x-3">
                      <Car className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Parking Spots</p>
                        <p className="text-base">{unit.features.parking_spots}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Box className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Storage Unit</p>
                        <p className="text-base">{unit.features.storage_unit ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {unit.current_tenant && (
                <Card className="border-0">
                  <CardContent className="p-4 space-y-2">  
                    <h4 className="text-sm font-medium">Current Tenant</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <p className="text-base">{unit.current_tenant.user.full_name}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <p className="text-base">{unit.current_tenant.user.email}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <p className="text-base">{unit.current_tenant.user.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between space-x-3 p-4 border-t">  
          <Button 
            variant="destructive" 
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />  
            Delete
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" />  
            Close
          </Button>
          <Button onClick={() => { onEdit(); onClose(); }}>
            <EditIcon className="mr-2 h-4 w-4" />  
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}