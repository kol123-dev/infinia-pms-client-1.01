"use client"

import { useState, useEffect, useCallback } from "react"
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
import { UnitImportDialog } from "./components/unit-import-dialog"
import { useSearchParams } from "next/navigation" // add

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

  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // New: search term state
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // Debounce search to avoid excessive requests
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
      // Reset to first page on new search
      setCurrentPage(0)
    }, 300)
    return () => clearTimeout(handle)
  }, [searchTerm])

  // Import dialog state
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Default sort: units by newest tenant (created_at desc). Units without tenant last.
  const sortUnitsByNewestTenant = (list: Unit[]) => {
    return [...list].sort((a, b) => {
      const aTime = a.current_tenant?.created_at ? new Date(a.current_tenant.created_at).getTime() : -Infinity
      const bTime = b.current_tenant?.created_at ? new Date(b.current_tenant.created_at).getTime() : -Infinity
      return bTime - aTime
    })
  }

  const searchParams = useSearchParams()
  const statusFilter = (searchParams.get("status") || "").toLowerCase()
  const propertyFilter = searchParams.get("property")

  const fetchUnits = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage + 1),
        page_size: String(pageSize),
      })
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm)
      }
      params.set("ordering", "-created_at")

      const response = await api.get(`/units/?${params.toString()}`);
      const sorted = [...response.data.results].sort((a: Unit, b: Unit) => {
        const aTime = new Date(a.created_at).getTime()
        const bTime = new Date(b.created_at).getTime()
        return bTime - aTime
      })

      // Apply client-side filter from URL params
      let filtered = sorted
      if (statusFilter === "occupied") {
        filtered = filtered.filter((u: Unit) => u.unit_status === "OCCUPIED")
      } else if (statusFilter === "vacant") {
        filtered = filtered.filter((u: Unit) => u.unit_status === "VACANT")
      } else if (statusFilter === "maintenance") {
        filtered = filtered.filter((u: Unit) => u.unit_status === "MAINTENANCE")
      } // "all" or empty -> no status filter

      if (propertyFilter) {
        const pid = Number(propertyFilter)
        if (!Number.isNaN(pid)) {
          filtered = filtered.filter((u: Unit) => u.property?.id === pid)
        }
      }

      setUnits(filtered);
      setTotalCount(filtered.length);
      setTotalPages(Math.ceil(filtered.length / pageSize));
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
  }, [currentPage, pageSize, toast, debouncedSearchTerm, statusFilter, propertyFilter]);

  useEffect(() => {
    fetchUnits();
    fetchStats();
  }, [currentPage, pageSize, fetchStats, fetchUnits]);
  
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
    // Ensure the directory refreshes after the dialog closes (success or cancel)
    fetchUnits();
    fetchStats();
  };

  const handleSuccess = () => {
    setCurrentPage(0);
    // Refresh immediately on success
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-lg font-semibold md:text-2xl">Units Management</h1>
            <div className="flex gap-2 sm:gap-3 flex-nowrap overflow-x-auto max-w-full">
              <Button 
                onClick={() => setIsBulkFormOpen(true)} 
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 h-8 sm:h-9 whitespace-nowrap min-w-0"
              >
                <Plus className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                Add Multiple Units
              </Button>
              <Button 
                onClick={() => setIsImportOpen(true)} 
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 h-8 sm:h-9 whitespace-nowrap min-w-0"
              >
                Import XLSX
              </Button>
              <Button 
                onClick={() => setIsFormOpen(true)}
                size="sm"
                className="text-xs sm:text-sm pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 h-8 sm:h-9 whitespace-nowrap min-w-0"
              >
                <Plus className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
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
                <Badge variant="destructive" className="text-xs ml-1">Repair</Badge>
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
            <div className="overflow-x-auto">
              <div className="block w-full align-middle">
                <DataTable<Unit, unknown>
                  columns={actionColumns}
                  data={units}
                  pageIndex={currentPage}
                  pageCount={totalPages}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={(newPage) => setCurrentPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(0);
                  }}
                  onRowClick={(row) => handleUnitClick(row.original)}
                  // New: wire robust search
                  searchValue={searchTerm}
                  onSearchChange={(term) => setSearchTerm(term)}
                />
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

      {isImportOpen && (
        <UnitImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => {
            setIsImportOpen(false)
            fetchUnits()
            fetchStats()
          }}
        />
      )}

      {isDetailsOpen && selectedUnit && (
        <UnitDetails
            unit={selectedUnit}
            isOpen={isDetailsOpen}
            onClose={() => {
                // Only close the details dialog; keep edit state intact
                setIsDetailsOpen(false);
            }}
            onEdit={() => handleEdit(selectedUnit)}
            onDelete={() => setIsDeleteOpen(true)}
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
