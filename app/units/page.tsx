"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Home } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { UnitForm } from "./components/unit-form"
import { UnitDetails } from "./components/unit-details"
import { Unit } from "./types"
import { BulkUnitForm } from "./components/bulk-unit-form"
import { DataTable } from "@/components/ui"
import { columns } from "./components/columns"

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0) // Changed to 0-based for tanstack table
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false)
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
      const response = await api.get(`/units/?page=${currentPage + 1}`) // Add 1 for API call
      setUnits(response.data.results)
      setTotalPages(Math.ceil(response.data.count / 10))
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

  return (
    <MainLayout>
      <div className="w-full max-w-[100vw] overflow-x-hidden">
        <div className="px-4 md:container md:mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-lg font-semibold md:text-2xl">Units Management</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsBulkFormOpen(true)} 
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Multiple Units
              </Button>
              <Button 
                onClick={() => setIsFormOpen(true)}
                size="sm"
                className="flex-1 sm:flex-none text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-5">
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-xs font-medium">Total Units</CardTitle>
                <Home className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-xl font-bold">{stats.total_units}</div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-xs font-medium">Occupied</CardTitle>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-xl font-bold">{stats.occupied_units}</div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-xs font-medium">Vacant</CardTitle>
                <Badge variant="default" className="text-xs">Available</Badge>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-xl font-bold">{stats.vacant_units}</div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-xs font-medium">Maintenance</CardTitle>
                <Badge variant="destructive" className="text-xs">Under Repair</Badge>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-xl font-bold">{stats.maintenance_units}</div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-xs font-medium">Occupancy Rate</CardTitle>
                <Badge variant="outline" className="text-xs">{Math.round(stats.occupancy_rate)}%</Badge>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-xl font-bold">{stats.occupancy_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full overflow-hidden rounded-lg border bg-card">
            <div className="w-full overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <DataTable
                  columns={columns}
                  data={units}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}