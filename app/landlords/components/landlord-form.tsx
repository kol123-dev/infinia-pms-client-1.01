import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

interface LandlordFormProps {
  landlord?: Landlord
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function LandlordForm({ landlord, isOpen, onClose, onSubmit }: LandlordFormProps) {
  const [formData, setFormData] = useState({
    business_name: landlord?.business_name || "",
    name: landlord?.name || "",
    email: landlord?.email || "",
    phone: landlord?.phone || "",
    id_number: landlord?.id_number || "",
    company_registration_number: landlord?.company_registration_number || ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{landlord ? 'Edit Landlord' : 'Add Landlord'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Contact Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="id_number">ID Number</Label>
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_registration_number">Company Registration Number</Label>
              <Input
                id="company_registration_number"
                value={formData.company_registration_number}
                onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{landlord ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}