"use client"

import { useEffect, useState, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { LandlordsSkeleton } from "@/components/landlords/LandlordsSkeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, Phone, Mail, Plus, Eye, MessageSquare, ChevronLeft, ChevronRight, Users, DollarSign, TrendingUp } from "lucide-react"
import api from "@/lib/axios"
import { LandlordDetails } from "./components/landlord-details"
import { LandlordForm } from "./components/landlord-form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { LandlordOnboardingFlow } from "./components/landlord-onboarding-flow"

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

  // Add state for potential monthly revenue totals
  // Add state for potential monthly revenue totals
  //
  const [potentialTotals, setPotentialTotals] = useState<Record<number, number>>({})

  // Helper to fetch potential monthly revenue for each property and sum by landlord
  const hydratePotentialTotals = useCallback(async (items: Landlord[]) => {
    const totals: Record<number, number> = {}
    await Promise.all(
      items.map(async (ld) => {
        const props = ld.properties ?? []
        const sums = await Promise.all(
          props.map(async (p) => {
            try {
              const res = await api.get(`/properties/${p.id}/`)
              const val = res.data?.financials?.summary?.potentialMonthlyRevenue ?? 0
              return Number(val) || 0
            } catch (e) {
              console.warn('Failed to fetch property potential revenue', p.id, e)
              return 0
            }
          })
        )
        totals[ld.id] = sums.reduce((a, b) => a + b, 0)
      })
    )
    setPotentialTotals(totals)
  }, [])

  const fetchLandlords = useCallback(async (url: string = '/landlords/') => {
    setLoading(true)
    try {
      const response = await api.get(url)
      const landlordsData = response.data as LandlordsResponse
      setLandlords(landlordsData.results)
      setTotalCount(landlordsData.count)
      setNextPage(landlordsData.next)
      setPreviousPage(landlordsData.previous)

      await hydratePotentialTotals(landlordsData.results)
    } catch (err) {
      setError('Failed to fetch landlords')
      console.error('Error fetching landlords:', err)
    } finally {
      setLoading(false)
    }
  }, [hydratePotentialTotals])

  useEffect(() => {
    fetchLandlords()
  }, [fetchLandlords])

  if (loading) return (
    <MainLayout>
      <LandlordsSkeleton />
    </MainLayout>
  )
  if (error) return <div>Error: {error}</div>

  const handleAddLandlord = async (data: any) => {
    try {
      await api.post('/landlords/', data)
      toast({ description: "Landlord created successfully", variant: "success" })
      setIsFormOpen(false)
      fetchLandlords()
    } catch (error: any) {
      console.error('Error creating landlord:', error)
      const data = error?.response?.data
      let description = data?.error || data?.message || "Failed to create landlord"
      if (data?.errors && typeof data.errors === 'object') {
        const messages = Object.entries(data.errors).map(([field, msg]) => {
          const text = Array.isArray(msg) ? msg.join(', ') : msg
          return `${field}: ${text}`
        })
        description = messages.join(' | ')
      }
      toast({ variant: "destructive", description, duration: 5000 })
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
  const combinedRevenue = landlords.reduce(
    (total, landlord) =>
      total +
      (landlord.properties?.reduce(
        (sum, property) => sum + (property.actual_monthly_revenue || 0),
        0
      ) || 0),
    0
  )
  // NEW: Sum potential monthly revenue across landlords (hydrated earlier)
  const combinedPotentialRevenue = Object.values(potentialTotals).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  )

  return (
    <>
      <MainLayout>
        {/* Header unchanged */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold md:text-2xl">Landlords</h1>
          <Button onClick={() => setShowOnboarding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Landlord
          </Button>
        </div>

        {/* Stats Grid - Mobile (compact accents + icons) */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-2 gap-2">
            <Card className="card-enhanced w-full">
              <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Landlords</CardTitle>
                <div className="p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-lg font-bold text-blue-600">{totalCount}</div>
                <p className="text-xs text-muted-foreground">Active partnerships</p>
              </CardContent>
            </Card>

            <Card className="card-enhanced w-full">
              <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Properties</CardTitle>
                <div className="p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <Building className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-lg font-bold text-blue-500">{totalProperties}</div>
                <p className="text-xs text-muted-foreground">Under management</p>
              </CardContent>
            </Card>

            <Card className="card-enhanced w-full">
              <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Combined Revenue</CardTitle>
                <div className="p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-lg font-bold text-emerald-600">{formatCurrency(combinedRevenue)}</div>
                <p className="text-xs text-muted-foreground">Monthly total</p>
              </CardContent>
            </Card>

            <Card className="card-enhanced w-full">
              <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Potential Revenue</CardTitle>
                <div className="p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-lg font-bold text-teal-600">{formatCurrency(combinedPotentialRevenue)}</div>
                <p className="text-xs text-muted-foreground">Monthly potential</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Grid - Desktop (same accents + icons) */}
        <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Landlords</CardTitle>
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Active partnerships</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                <Building className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-500">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Under management</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Combined Revenue</CardTitle>
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(combinedRevenue)}</div>
              <p className="text-xs text-muted-foreground">Monthly total</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover:shadow-theme-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential Revenue</CardTitle>
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-teal-600">{formatCurrency(combinedPotentialRevenue)}</div>
              <p className="text-xs text-muted-foreground">Monthly potential</p>
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
                  {/* Replace label */}
                  <TableHead>Potential Monthly Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landlords.map((landlord) => (
                  <TableRow key={landlord.id}>
                    {/* Landlord */}
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
                    {/* Contact */}
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
                    {/* Properties */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{landlord.properties?.length || 0} Properties</span>
                      </div>
                    </TableCell>
                    {/* Total Units */}
                    <TableCell>
                      {landlord.properties?.reduce((total, property) => total + (property.total_units || 0), 0) || 0} Units
                    </TableCell>
                    {/* Potential Monthly Revenue */}
                    <TableCell>
                      {formatCurrency(potentialTotals[landlord.id] ?? 0)}
                    </TableCell>
                    {/* Actions */}
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
        <LandlordOnboardingFlow
            onClose={() => setShowOnboarding(false)}
            onRefresh={() => fetchLandlords()}
        />
      )}
    </>
  )
}