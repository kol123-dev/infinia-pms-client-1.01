"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, Book, FileQuestion, Phone, Mail } from "lucide-react"

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">
            Get help with using Infinia Property Management System
          </p>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          {/* Reduced tabs list to two items */}
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="faq" className="flex gap-2">
              <FileQuestion className="h-4 w-4" />
              <span>FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex gap-2">
              <Phone className="h-4 w-4" />
              <span>Contact Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Keep FAQ content */}
          <TabsContent value="faq">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Find answers to common questions about using the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">How do I add a new tenant?</h3>
                      <p className="text-sm text-muted-foreground">
                        Navigate to the Tenants section from the sidebar, then click the "Add Tenant" button. Fill in the required information and save the form.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">How do I record a payment?</h3>
                      <p className="text-sm text-muted-foreground">
                        Go to the Payments section, select the tenant, and click "Record Payment". Enter the payment details and submit the form.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">How do I generate reports?</h3>
                      <p className="text-sm text-muted-foreground">
                        Visit the Reports section, select the type of report you need, set the date range, and click "Generate Report".
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Keep Contact Support content */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Get in touch with our support team for assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Phone className="h-5 w-5 text-brand-500" />
                    <div>
                      <h3 className="font-medium">Phone Support</h3>
                      <p className="text-sm text-muted-foreground">+1 (800) 123-4567</p>
                      <p className="text-xs text-muted-foreground">Available Monday-Friday, 9am-5pm EST</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Mail className="h-5 w-5 text-brand-500" />
                    <div>
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-sm text-muted-foreground">support@infiniasync.com</p>
                      <p className="text-xs text-muted-foreground">We typically respond within 24 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}