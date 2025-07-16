import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building, Phone, Mail, CreditCard, Calendar, FileText } from "lucide-react"
import { format } from 'date-fns'

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

  const totalRevenue = landlord.properties?.reduce((sum, prop) => sum + prop.actual_monthly_revenue, 0) || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Landlord Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          {/* Header Section */}
          <div className="flex items-center gap-6 bg-secondary/20 p-6 rounded-lg">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarFallback className="text-xl">{landlord.user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-bold mb-1">{landlord.user.full_name}</h3>
              <p className="text-muted-foreground text-lg">{landlord.business_name}</p>
              <Badge className="mt-2" variant="secondary">
                {landlord.properties?.length || 0} Properties
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid gap-4 bg-card p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold mb-2">Contact Information</h4>
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-lg">{landlord.user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-lg">{landlord.user.phone}</span>
              </div>
              {landlord.id_number && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-lg">ID: {landlord.id_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Properties Section */}
          {landlord.properties && landlord.properties.length > 0 && (
            <div className="grid gap-4 bg-card p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Properties</h4>
                <Badge variant="secondary" className="text-base px-4 py-1">
                  Total Revenue: ${totalRevenue.toLocaleString()}/month
                </Badge>
              </div>
              <div className="grid gap-3">
                {landlord.properties.map((property) => (
                  <div key={property.id} 
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-primary" />
                      <span className="text-lg font-medium">{property.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-base">
                        {property.total_units} Units
                      </Badge>
                      <Badge variant="outline" className="text-base text-green-600 bg-green-50">
                        ${property.actual_monthly_revenue.toLocaleString()}/mo
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Info */}
          <div className="grid gap-4 bg-card p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold">Registration Details</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Registered: {format(new Date(landlord.created_at), 'PPP')}</span>
              </div>
              {landlord.company_registration_number && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Company Reg: {landlord.company_registration_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => onEdit(landlord)}>Edit</Button>
          <Button variant="destructive" onClick={() => onDelete(landlord)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}