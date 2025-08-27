"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, Phone, Mail, Plus, Eye, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import api from "@/lib/axios"
import { LandlordDetails } from "./components/landlord-details"
import { LandlordForm } from "./components/landlord-form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { LandlordOnboardingFlow } from "./components/landlord-onboarding-flow"

// Add this import at the top with other imports
import { formatCurrency } from "@/lib/utils"

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

interface LandlordsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Landlord[]
}

export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | undefined>(undefined)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [previousPage, setPreviousPage] = useState<string | null>(null)

  const fetchLandlords = async (url: string = '/landlords/') => {
    setLoading(true)
    try {
      const response = await api.get(url)
      const landlordsData = response.data as LandlordsResponse
      setLandlords(landlordsData.results)
      setTotalCount(landlordsData.count)
      setNextPage(landlordsData.next)
      setPreviousPage(landlordsData.previous)
    } catch (err) {
      setError('Failed to fetch landlords')
      console.error('Error fetching landlords:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLandlords()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  const handleAddLandlord = async (data: any) => {
    try {
      await api.post('/landlords/', data)
      toast({ description: "Landlord created successfully", variant: "success" })
      setIsFormOpen(false)
      fetchLandlords()
    } catch (error) {
      console.error('Error creating landlord:', error)
      toast({ variant: "destructive", description: "Failed to create landlord" })
    }
  }

  const handleEditLandlord = async (data: any) => {
    try {
      await api.put(`/landlords/${selectedLandlord?.id}/`, data)
      toast({ description: "Landlord updated successfully", variant: "success" })
      setIsFormOpen(false)
      fetchLandlords()
    } catch (error) {
      console.error('Error updating landlord:', error)
      toast({ variant: "destructive", description: "Failed to update landlord" })
    }
  }

  const handleDeleteLandlord = async () => {
    try {
      await api.delete(`/landlords/${selectedLandlord?.id}/`)
      toast({ description: "Landlord deleted successfully", variant: "success" })
      setIsDeleteDialogOpen(false)
      setIsDetailsOpen(false)
      fetchLandlords()
    } catch (error) {
      console.error('Error deleting landlord:', error)
      toast({ variant: "destructive", description: "Failed to delete landlord" })
    }
  }

  // Calculate summary statistics
  const totalProperties = landlords.reduce((total, landlord) => total + (landlord.properties?.length || 0), 0)
  const combinedRevenue = landlords.reduce((total, landlord) => 
    total + (landlord.properties?.reduce((sum, property) => sum + (property.actual_monthly_revenue || 0), 0) || 0), 0
  )

  return (
    <>
      <MainLayout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold md:text-2xl">Landlords</h1>
          <Button onClick={() => setShowOnboarding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Landlord
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Landlords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}</div>
              <p className="text-xs text-blue-600/75 dark:text-blue-400/75">Active partnerships</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalProperties}</div>
              <p className="text-xs text-purple-600/75 dark:text-purple-400/75">Under management</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Combined Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(combinedRevenue)}
              </div>
              <p className="text-xs text-emerald-600/75 dark:text-emerald-400/75">Monthly total</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Landlord Directory</CardTitle>
            <CardDescription>Manage property owners and their portfolios</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Total Units</TableHead>
                  <TableHead>Monthly Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landlords.map((landlord) => (
                  <TableRow key={landlord.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {landlord.user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{landlord.user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{landlord.business_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          {landlord.user.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4" />
                          {landlord.user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{landlord.properties?.length || 0} Properties</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {landlord.properties?.reduce((total, property) => total + (property.total_units || 0), 0) || 0} Units
                    </TableCell>
                    <TableCell>
                      ${landlord.properties?.reduce((total, property) => total + (property.actual_monthly_revenue || 0), 0).toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(landlord.properties?.reduce((total, property) => 
                        total + (property.actual_monthly_revenue || 0), 0) || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLandlord(landlord)
                            setIsDetailsOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {landlords.length} of {totalCount} landlords
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previousPage && fetchLandlords(previousPage)}
                  disabled={!previousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nextPage && fetchLandlords(nextPage)}
                  disabled={!nextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <LandlordDetails
          landlord={selectedLandlord}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={(landlord) => {
            setSelectedLandlord(landlord)
            setIsEditing(true)
            setIsDetailsOpen(false)
            setIsFormOpen(true)
          }}
          onDelete={(landlord) => {
            setSelectedLandlord(landlord)
            setIsDeleteDialogOpen(true)
          }}
        />

        <LandlordForm
          landlord={isEditing ? selectedLandlord : undefined}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setIsEditing(false)
            setSelectedLandlord(undefined)
          }}
          onSubmit={isEditing ? handleEditLandlord : handleAddLandlord}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the landlord
                and remove their data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLandlord}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
      
      {showOnboarding && (
        <LandlordOnboardingFlow onClose={() => setShowOnboarding(false)} />
      )}
    </>
  )
}