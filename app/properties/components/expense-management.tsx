"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseFormulas } from "@/app/properties/components/expense-formulas"
import { ExpenseList } from "@/app/properties/components/expense-list"
import { MonthlyFinancials } from "@/app/properties/components/monthly-financials"

export function ExpenseManagement({ propertyId }: { propertyId: string }) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="formulas">Expense Formulas</TabsTrigger>
        <TabsTrigger value="expenses">Expense Records</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyFinancials propertyId={propertyId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="formulas">
        <Card>
          <CardHeader>
            <CardTitle>Expense Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseFormulas propertyId={propertyId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="expenses">
        <Card>
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseList propertyId={propertyId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}