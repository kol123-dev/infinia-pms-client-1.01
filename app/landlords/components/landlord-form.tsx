import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, User, Phone, Mail, FileText, Building, Calendar } from "lucide-react"

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

interface LandlordFormProps {
  landlord?: Landlord
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function LandlordForm({ landlord, isOpen, onClose, onSubmit }: LandlordFormProps) {
  const [formData, setFormData] = useState({
    business_name: landlord?.business_name || "",
    full_name: landlord?.user?.full_name || "",
    email: landlord?.user?.email || "",
    phone: landlord?.phone || landlord?.user?.phone || "",
    id_number: landlord?.id_number || "",
    company_registration_number: landlord?.company_registration_number || "",
    user: landlord?.user?.id // Add this line to track the user ID
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For updates, include the user ID
    if (landlord) {
      onSubmit({
        ...formData,
        user: landlord.user.id // Ensure user ID is included for updates
      })
    } else {
      // For new landlords, don't include the user field
      const { user, ...newLandlordData } = formData
      onSubmit(newLandlordData)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            {landlord ? 'Edit Landlord' : 'Add Landlord'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {landlord ? 'Update the landlord\'s information below.' : 'Fill in the landlord\'s details to create a new account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-1">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Building2 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Business Information</h3>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="business_name" className="flex items-center gap-1">
                      Business Name
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Enter business name"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_registration_number">
                      Company Registration Number
                    </Label>
                    <Input
                      id="company_registration_number"
                      value={formData.company_registration_number}
                      onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
                      placeholder="Enter company registration number"
                      className="focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full_name" className="flex items-center gap-1">
                      Full Name
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter full name"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      Phone Number
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Identification</h3>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      placeholder="Enter ID number"
                      className="focus-visible:ring-primary"
                    />
                    <p className="text-sm text-muted-foreground">This information will be encrypted for security</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {landlord && (
            <Card className="shadow-sm bg-muted/50">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <p className="text-sm">Created: {new Date(landlord.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-4 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
            >
              {landlord ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}