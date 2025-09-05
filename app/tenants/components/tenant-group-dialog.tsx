import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Tenant } from "../types"
import api from "@/lib/axios"

interface TenantGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tenants: Tenant[]
}

export function TenantGroupDialog({ isOpen, onClose, onSuccess, tenants }: TenantGroupDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name) return
    
    setIsSubmitting(true)
    try {
      await api.post("/tenants/groups/", {
        name,
        description,
        tenants: selectedTenants
      })
      
      toast({ description: "Tenant group created successfully" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating tenant group:", error)
      toast({ variant: "destructive", description: "Failed to create tenant group" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Tenant Group</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
            />
          </div>

          <div className="space-y-2">
            <Label>Select Tenants</Label>
            <Select
              value={selectedTenants.join(",")}
              onValueChange={(value) => setSelectedTenants(value.split(",").filter(Boolean))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tenants" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id.toString()}>
                    {tenant.user?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name}
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}