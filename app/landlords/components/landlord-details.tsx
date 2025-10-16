'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building, Phone, Mail, CreditCard, Calendar, FileText, X } from "lucide-react"
import { format } from 'date-fns'
import { useEffect, useState } from "react"
import api from "@/lib/axios"

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
  // Fetch property potential monthly revenue
  const [potentialByPropertyId, setPotentialByPropertyId] = useState<Record<number, number>>({})

  useEffect(() => {
    if (!isOpen || !landlord) return
    const load = async () => {
      const entries = await Promise.all(
        (landlord?.properties ?? []).map(async (p) => {
          try {
            const res = await api.get(`/properties/${p.id}/`)
            const val = res.data?.financials?.summary?.potentialMonthlyRevenue ?? 0
            return [p.id, Number(val) || 0] as [number, number]
          } catch {
            return [p.id, 0]
          }
        })
      )
      setPotentialByPropertyId(Object.fromEntries(entries))
    }
    load()
  }, [isOpen, landlord])

  if (!landlord) return null

  const totalRevenue =
    landlord?.properties?.reduce((sum, prop) => sum + (prop.actual_monthly_revenue || 0), 0) || 0

  const totalPotential = (landlord?.properties ?? []).reduce(
    (sum, p) => sum + (potentialByPropertyId[p.id] ?? 0),
    0
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background dark:bg-background">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Landlord Details</DialogTitle>
            {/* Removing the custom X button that was causing duplication */}
          </div>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Header Section */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/10">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="text-lg">{landlord.user.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{landlord.user.full_name}</h3>
                <p className="text-muted-foreground">{landlord.business_name}</p>
                <Badge className="mt-1" variant="secondary">
                  {landlord.properties?.length || 0} Properties
                </Badge>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">{landlord.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">{landlord.user.phone}</span>
                </div>
                {landlord.id_number && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">ID: {landlord.id_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Properties Section */}
            {landlord.properties && landlord.properties.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground">Properties</h4>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {/* Show total potential instead of actual */}
                    Total Potential Revenue: ${totalPotential.toLocaleString()}/month
                  </Badge>
                </div>
                <div className="space-y-2">
                  {landlord.properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between rounded-md border p-2 hover:bg-secondary/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{property.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {property.total_units} Units
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-600 bg-green-50">
                          {`$${(potentialByPropertyId[property.id] ?? 0).toLocaleString()}/mo`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Registration Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Registered: {format(new Date(landlord.created_at), 'PPP')}</span>
                </div>
                {landlord.company_registration_number && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="text-sm">Company Reg: {landlord.company_registration_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(landlord)}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(landlord)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}