"use client"

import { useState, useEffect, useCallback } from "react"  // Add useCallback here
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
import { DataTable } from "./components/data-table"
import { columns } from "./components/columns"
import { ColumnDef } from "@tanstack/react-table"

// Add these imports after existing imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false)
  const { toast } = useToast()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)  // Add this line here for the delete confirmation dialog

  const [stats, setStats] = useState({
    total_units: 0,
    occupied_units: 0,
    vacant_units: 0,
    maintenance_units: 0,
    occupancy_rate: 0
  })

  const fetchStats = useCallback(async () => {
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
  }, [toast])

  const [pageSize, setPageSize] = useState(10); // New state for page size
  const [totalCount, setTotalCount] = useState(0); // New state for total units count

  const fetchUnits = useCallback(async () => {
    try {
      const response = await api.get(`/units/?page=${currentPage + 1}&page_size=${pageSize}`);
      setUnits(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load units"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, toast]);

  useEffect(() => {
    fetchUnits();
    fetchStats();
  }, [currentPage, pageSize, fetchStats, fetchUnits]);  // Added pageSize here

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDetailsOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setSelectedUnit(undefined);
  };

  const handleSuccess = () => {
    setCurrentPage(0);
    fetchUnits();
    fetchStats();
    handleCloseForm();
  };

  const actionColumns: ColumnDef<Unit>[] = [
    ...columns,
    {
      id: "actions",
      cell: ({ row }) => (
        <Button onClick={() => handleEdit(row.original)}>Edit</Button>
      ),
    },
  ];

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
                <DataTable<Unit, unknown>
                  columns={actionColumns}
                  data={units}
                  pageIndex={currentPage}
                  pageCount={totalPages}
                  pageSize={pageSize} // Pass current pageSize
                  totalCount={totalCount} // New prop for total count
                  onPageChange={(newPage) => setCurrentPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(0); // Reset to first page on size change
                  }} // New prop for handling size change
                  onRowClick={(row) => handleUnitClick(row.original)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <UnitForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
          unit={isEditing ? selectedUnit : undefined}
        />
      )}

      {isBulkFormOpen && (
        <BulkUnitForm
          isOpen={isBulkFormOpen}
          onClose={() => setIsBulkFormOpen(false)}
          onSuccess={() => {
            setIsBulkFormOpen(false);
            fetchUnits();
            fetchStats();
          }}
        />
      )}

      {isDetailsOpen && selectedUnit && (
        <UnitDetails
          unit={selectedUnit}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedUnit(undefined);  // Add this: Clear selectedUnit
            setIsFormOpen(false);        // Add this: Ensure edit form is closed
            setIsEditing(false);         // Add this: Reset editing state
          }}  // Updated onClose to reset all states
          onEdit={() => handleEdit(selectedUnit)}
          onDelete={() => setIsDeleteOpen(true)}  // New prop to open confirmation
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the unit and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              try {
                await api.delete(`/units/${selectedUnit?.id}/`);
                toast({ title: "Unit deleted successfully" });
                fetchUnits();
                fetchStats();
                setIsDetailsOpen(false);
                setSelectedUnit(undefined);  // Add this: Clear selectedUnit to prevent lingering state
                setIsFormOpen(false);        // Add this: Ensure edit form is closed
                setIsEditing(false);         // Add this: Reset editing state
              } catch (error) {
                toast({ variant: "destructive", title: "Error deleting unit", description: "Please try again." });
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </MainLayout>
  );
}