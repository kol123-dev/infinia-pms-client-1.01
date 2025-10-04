"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building, MapPin, Users, DollarSign, Plus, Eye, Settings } from "lucide-react"
import api from "@/lib/axios"

// Add this import at the top with other imports
import { formatCurrency } from "@/lib/utils"

import { PropertyForm } from "./components/property-form"
// Update the PropertyDetails import path
import { PropertyDetails } from "./components/property-details"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

import { Input } from "@/components/ui/input"

import { Property, PropertiesResponse } from "./types"

// Remove the existing interfaces since we're importing them
import Image from "next/image"

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  // Fix the filter function arrow syntax
  const filteredProperties = properties.filter((property) =>
    property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Properties</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <Input
        className="mb-6 max-w-sm"
        placeholder="Search properties by name or location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property: Property) => (
          <Card key={property.id} className="overflow-hidden border border-border/50 rounded-xl shadow-sm">
            <div className="aspect-[4/3] bg-muted relative">  
              <Image
                src="/placeholder.svg"
                alt={property.name || 'Unnamed Property'}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    {property.name || 'Unnamed Property'}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1 text-xs sm:text-sm">
                    <MapPin className="mr-1 h-3 w-3" />
                    {property.location.address}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {property.property_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <Building className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-blue-600">{property.units.summary.total} units</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-blue-600">{property.units.summary.occupied} occupied</span>
                </div>
                <div className="flex items-center col-span-1 sm:col-span-2 font-medium">  
                  <span className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex items-center justify-center text-[8px] sm:text-[10px] font-bold">KES</span>
                  <span className="text-green-600">{formatCurrency(property.financials?.summary?.lastMonthlyRevenue || 0)} Last month</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>Occupancy Rate</span>
                  <span className="text-emerald-600">{Math.round((property.units.summary.occupied / property.units.summary.total) * 100)}%</span>
                </div>
                <Progress value={(property.units.summary.occupied / property.units.summary.total) * 100} className="h-1.5 sm:h-2" />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent text-xs sm:text-sm"
                  onClick={() => {
                    setSelectedProperty(property)
                    setIsDetailsDialogOpen(true)
                  }}
                >
                  <Eye className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setSelectedProperty(property)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
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
