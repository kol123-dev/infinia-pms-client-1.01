"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building, MapPin, Users, DollarSign, Plus, Eye, Settings } from "lucide-react"
import api from "@/lib/axios"


import { PropertyForm } from "./components/property-form"
// Update the PropertyDetails import path
import { PropertyDetails } from "./components/property-details"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

import { Property, PropertiesResponse } from "./types"

// Remove the existing interfaces since we're importing them

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const handleDelete = async (propertyId: number) => {
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        await api.delete(`/properties/${propertyId}/`)
        setProperties(properties.filter(p => p.id !== propertyId))
        toast({
          title: "Success",
          description: "Property deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting property:", error)
        toast({
          title: "Error",
          description: "Failed to delete property",
          variant: "destructive",
        })
      }
    }
  }

  const handlePropertyUpdate = async () => {
    try {
      const response = await api.get('/properties/')
      const data = response.data as PropertiesResponse
      setProperties(data.results)
      toast({
        title: "Success",
        description: "Property updated successfully",
      })
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties/')
        const data = response.data as PropertiesResponse
        setProperties(data.results)
      } catch (err) {
        setError('Failed to fetch properties')
        console.error('Error fetching properties:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Properties</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            <div className="aspect-video bg-muted">
              <img
                src="/placeholder.svg"
                alt={property.name}
                className="h-full w-full object-cover"
              />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="mr-1 h-3 w-3" />
                    {property.location.address}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{property.property_type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{property.units.summary.total} units</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{property.units.summary.occupied} occupied</span>
                </div>
                <div className="flex items-center col-span-2">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>${(property.financials?.summary?.actualMonthlyRevenue || 0).toLocaleString()}/month</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Occupancy Rate</span>
                  <span>{Math.round((property.units.summary.occupied / property.units.summary.total) * 100)}%</span>
                </div>
                <Progress value={(property.units.summary.occupied / property.units.summary.total) * 100} className="h-2" />
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedProperty(property)
                    setIsDetailsDialogOpen(true)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProperty(property)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Performance Summary</CardTitle>
          <CardDescription>Overview of all properties performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {properties.reduce((sum, p) => sum + p.units.summary.total, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {properties.reduce((sum, p) => sum + p.units.summary.occupied, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Occupied Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {Math.round(
                  (properties.reduce((sum, p) => sum + p.units.summary.occupied, 0) /
                    properties.reduce((sum, p) => sum + p.units.summary.total, 0)) *
                    100
                )}%
              </div>
              <div className="text-sm text-muted-foreground">Average Occupancy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PropertyForm
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handlePropertyUpdate}
      />

      {selectedProperty && (
        <>
          <PropertyForm
            property={selectedProperty}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setSelectedProperty(null)
            }}
            onSuccess={handlePropertyUpdate}
          />

          <PropertyDetails
            property={selectedProperty}
            isOpen={isDetailsDialogOpen}
            onClose={() => {
              setIsDetailsDialogOpen(false)
              setSelectedProperty(null)
            }}
            onDelete={handlePropertyUpdate}
          />
        </>
      )}
    </MainLayout>
  )
}
