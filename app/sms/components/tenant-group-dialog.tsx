import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import axios from "@/lib/axios"

interface TenantGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function TenantGroupDialog({ isOpen, onClose, onSubmit }: TenantGroupDialogProps) {
  const form = useForm()

  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await axios.get("/properties/")
      return response.data.results
    }
  })

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["property-tenants", form.watch("property")],
    queryFn: async () => {
      if (!form.watch("property")) return []
      const response = await axios.get(`/properties/${form.watch("property")}/tenants/`)
      return response.data.results
    },
    enabled: !!form.watch("property")
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tenant Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="property"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties?.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenants</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange([...field.value || [], value])}
                    value={field.value?.[0] || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenants" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants?.map((tenant: any) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.user?.full_name || tenant.tenant_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit">Create Group</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}