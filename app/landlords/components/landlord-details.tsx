import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building, Phone, Mail } from "lucide-react"

interface Landlord {
  id: number
  landlord_id: string | null
  user: {
    id: number
    email: string
    full_name: string
    phone: string
    role: string
    is_active: boolean
  }
  agent: any | null
  name: string | null
  email: string | null
  phone: string | null
  id_number: string | null
  business_name: string
  company_registration_number: string | null
  created_at: string
  properties: {
    id: number
    name: string
    total_units: number
    actual_monthly_revenue: number
  }[] | null
}

interface LandlordDetailsProps {
  landlord: Landlord | null | undefined
  isOpen: boolean
  onClose: () => void
  onEdit: (landlord: Landlord) => void
  onDelete: (landlord: Landlord) => void
}

export function LandlordDetails({ landlord, isOpen, onClose, onEdit, onDelete }: LandlordDetailsProps) {
  if (!landlord) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Landlord Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{landlord.user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{landlord.user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{landlord.business_name}</p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{landlord.user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{landlord.user.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>{landlord.properties?.length || 0} Properties</span>
            </div>
          </div>

          {landlord.properties && landlord.properties.length > 0 && (
            <div className="grid gap-2">
              <h4 className="font-semibold">Properties</h4>
              <div className="grid gap-1">
                {landlord.properties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between rounded-lg border p-2">
                    <span>{property.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{property.total_units} Units</Badge>
                      <Badge variant="outline">${property.actual_monthly_revenue.toLocaleString()}/mo</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => onEdit(landlord)}>Edit</Button>
          <Button variant="destructive" onClick={() => onDelete(landlord)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}