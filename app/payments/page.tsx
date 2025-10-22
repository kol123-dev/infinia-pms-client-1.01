"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentList } from "./components/payment-list"
import { PaymentStats } from "./components/payment-stats"
import Link from "next/link"
import { MpesaTransactionList } from "./components/mpesa-transaction-list"
import BankTransactionList from "./components/bank-transaction-list"
import { CashPaymentList } from "./components/cash-payment-list"
import { InvoiceList } from "./components/invoice-list"
import { CreateInvoiceDialog } from "./components/create-invoice-dialog"
import { RecordPaymentDialog } from "./components/record-payment-dialog"

export default function PaymentsPage() {
  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold">Payments Management</h1>
        <div className="w-full sm:w-auto grid grid-cols-2 gap-2 sm:flex sm:space-x-2">
          <CreateInvoiceDialog>
            <Button className="w-full sm:w-auto">
              <span className="sm:hidden">Invoice</span>
              <span className="hidden sm:inline">Create Invoice</span>
            </Button>
          </CreateInvoiceDialog>
          <RecordPaymentDialog>
            <Button variant="secondary" className="w-full sm:w-auto">
              <span className="sm:hidden">Payment</span>
              <span className="hidden sm:inline">Record Payment</span>
            </Button>
          </RecordPaymentDialog>
        </div>
      </div>

      <PaymentStats />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="sticky top-0 z-10 bg-background overflow-x-auto scrollbar-hide">
          <TabsList className="flex space-x-2 min-w-max flex-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
            <TabsTrigger value="bank">Bank Transfers</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <PaymentList />
        </TabsContent>

        <TabsContent value="mpesa">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa Transactions</CardTitle>
              <CardDescription>Track M-Pesa payments and reconciliation status</CardDescription>
            </CardHeader>
            <CardContent>
              <MpesaTransactionList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Transfers</CardTitle>
              <CardDescription>Track bank transfer payments and reconciliation status</CardDescription>
            </CardHeader>
            <CardContent>
              <BankTransactionList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle>Cash Payments</CardTitle>
              <CardDescription>Track cash payments and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <CashPaymentList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage tenant invoices and payment tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
