"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Home, Eye, Edit, Search } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { UnitForm } from "./components/unit-form"
import { UnitDetails } from "./components/unit-details"
import { Unit } from "./types"

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const [stats, setStats] = useState({
    total_units: 0,
    occupied_units: 0,
    vacant_units: 0,
    maintenance_units: 0,
    occupancy_rate: 0
  })

  useEffect(() => {
    fetchUnits()
    fetchStats()
  }, [currentPage])

  const fetchStats = async () => {
    try {
      const response = await api.get('/units/stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load unit statistics"
      })
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await api.get(`/units/?page=${currentPage}`)
      setUnits(response.data.results)
      setTotalPages(Math.ceil(response.data.count / 10)) // Assuming 10 items per page
    } catch (error) {
      console.error('Error fetching units:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load units"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.current_tenant?.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || unit.unit_status === statusFilter
    const matchesProperty = propertyFilter === "all" || unit.property.id.toString() === propertyFilter
    return matchesSearch && matchesStatus && matchesProperty
  })

  const properties = Array.from(new Set(units.map(unit => 
    JSON.stringify({id: unit.property.id, name: unit.property.name})
  ))).map(str => JSON.parse(str))

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Units Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_units}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Badge variant="secondary">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupied_units}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant</CardTitle>
            <Badge variant="default">Available</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vacant_units}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Badge variant="destructive">Under Repair</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenance_units}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Badge variant="outline">{Math.round(stats.occupancy_rate)}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancy_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="VACANT">Vacant</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={`property-${property.id}`} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((currentUnit) => (
            <Card key={currentUnit.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unit {currentUnit.unit_number}
                </CardTitle>
                <Badge
                  variant={currentUnit.unit_status === 'VACANT' ? 'default' : 
                          currentUnit.unit_status === 'OCCUPIED' ? 'secondary' : 'destructive'}
                >
                  {currentUnit.unit_status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {currentUnit.rent}</div>
                <p className="text-xs text-muted-foreground">{currentUnit.unit_type}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span className="text-sm">{currentUnit.property.name}</span>
                  </div>
                  {currentUnit.current_tenant && (
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      <span className="text-sm">{currentUnit.current_tenant.user.full_name}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsDetailsOpen(true)
                      setSelectedUnit(currentUnit)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsFormOpen(true)
                      setSelectedUnit(currentUnit)
                      setIsEditing(true)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isFormOpen && (
        <UnitForm
          unit={selectedUnit}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedUnit(undefined)
            setIsEditing(false)
          }}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedUnit(undefined)
            setIsEditing(false)
            fetchUnits()
          }}
        />
      )}

      {isDetailsOpen && selectedUnit && (
        <UnitDetails
          unit={selectedUnit}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false)
            setSelectedUnit(undefined)
          }}
          onEdit={() => {
            setIsDetailsOpen(false)
            setIsFormOpen(true)
            setIsEditing(true)
          }}
        />
      )}
      <div className="mt-8 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </MainLayout>
  )
}