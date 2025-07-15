"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, CheckCircle, Clock, AlertTriangle, Camera, FileText } from "lucide-react"

const moveInChecklist = [
  { id: 1, item: "Keys provided", checked: false, required: true },
  { id: 2, item: "Lease agreement signed", checked: false, required: true },
  { id: 3, item: "Security deposit collected", checked: false, required: true },
  { id: 4, item: "Utilities transferred", checked: false, required: false },
  { id: 5, item: "Property walkthrough completed", checked: false, required: true },
  { id: 6, item: "Emergency contacts collected", checked: false, required: true },
  { id: 7, item: "Parking assignment", checked: false, required: false },
  { id: 8, item: "Welcome packet provided", checked: false, required: false },
]

const moveOutChecklist = [
  { id: 1, item: "Notice received (30 days)", checked: false, required: true },
  { id: 2, item: "Final inspection scheduled", checked: false, required: true },
  { id: 3, item: "Keys returned", checked: false, required: true },
  { id: 4, item: "Utilities disconnected", checked: false, required: false },
  { id: 5, item: "Cleaning completed", checked: false, required: true },
  { id: 6, item: "Damages assessed", checked: false, required: true },
  { id: 7, item: "Security deposit processed", checked: false, required: true },
  { id: 8, item: "Final walkthrough completed", checked: false, required: true },
]

const activeProcesses = [
  {
    id: 1,
    type: "move-in",
    tenant: "Alice Johnson",
    property: "Sunset Apartments",
    unit: "5A",
    date: "2024-01-15",
    status: "in-progress",
    completedItems: 5,
    totalItems: 8,
  },
  {
    id: 2,
    type: "move-out",
    tenant: "Bob Wilson",
    property: "Downtown Complex",
    unit: "3B",
    date: "2024-01-20",
    status: "scheduled",
    completedItems: 2,
    totalItems: 8,
  },
]

export default function MoveInOut() {
  const [selectedProcess, setSelectedProcess] = useState<(typeof activeProcesses)[0] | null>(null)
  const [checklistItems, setChecklistItems] = useState(moveInChecklist)

  const handleChecklistChange = (id: number, checked: boolean) => {
    setChecklistItems((items) => items.map((item) => (item.id === id ? { ...item, checked } : item)))
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Move In/Out Process</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Process
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProcesses.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Completed processes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Move Processes</CardTitle>
          <CardDescription>Track ongoing move-in and move-out procedures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeProcesses.map((process) => (
              <div key={process.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant={process.type === "move-in" ? "default" : "secondary"}>
                    {process.type === "move-in" ? "Move In" : "Move Out"}
                  </Badge>
                  <div>
                    <div className="font-medium">{process.tenant}</div>
                    <div className="text-sm text-muted-foreground">
                      {process.property} - Unit {process.unit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {process.completedItems}/{process.totalItems} completed
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(process.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="w-20">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(process.completedItems / process.totalItems) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedProcess(process)}>
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {process.type === "move-in" ? "Move In" : "Move Out"} Process - {process.tenant}
                        </DialogTitle>
                        <DialogDescription>
                          {process.property} - Unit {process.unit}
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="checklist" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="checklist">Checklist</TabsTrigger>
                          <TabsTrigger value="inspection">Inspection</TabsTrigger>
                          <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="checklist" className="space-y-4">
                          <div className="space-y-3">
                            {(process.type === "move-in" ? moveInChecklist : moveOutChecklist).map((item) => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`item-${item.id}`}
                                  checked={item.checked}
                                  onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                                />
                                <Label htmlFor={`item-${item.id}`} className="flex-1">
                                  {item.item}
                                  {item.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="inspection" className="space-y-4">
                          <div className="grid gap-4">
                            <div>
                              <Label htmlFor="inspection-notes">Inspection Notes</Label>
                              <Textarea
                                id="inspection-notes"
                                placeholder="Document any issues, damages, or observations..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Photo Documentation</Label>
                              <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                                <div className="mt-2">
                                  <Button variant="outline">Upload Photos</Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">Upload inspection photos</p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="documents" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Lease Agreement</span>
                              </div>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Security Deposit Receipt</span>
                              </div>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Move-in Inspection Report</span>
                              </div>
                              <Button variant="outline" size="sm">
                                Generate
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
