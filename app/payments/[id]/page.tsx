"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import axios from "@/lib/axios"

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [payment, setPayment] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`/payments/payments/${id}/`)
        setPayment(data)
        setError(null)
      } catch (e) {
        console.error("Failed to load payment detail", e)
        setError("Failed to load payment details.")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const fmtAmount = (n: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n)

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>View payment information and manage records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && payment && (
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Tenant</h4>
                  <p className="text-sm">{payment?.tenant?.user?.full_name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{payment?.tenant?.user?.email || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{payment?.tenant?.user?.phone || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Property</h4>
                  <p className="text-sm">{payment?.property?.name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">
                    Unit {payment?.unit?.unit_number || payment?.tenant?.current_unit?.unit_number || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Payment</h4>
                  <p className="text-sm">Amount: {fmtAmount(Number(payment?.amount || 0))}</p>
                  <p className="text-sm">New Balance: {fmtAmount(Number(payment?.balance_after || 0))}</p>
                  <p className="text-sm">Date: {payment?.paid_date || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <p className="text-sm">Method: {payment?.payment_method || "N/A"}</p>
                  <p className="text-sm">Type: {payment?.payment_type || "N/A"}</p>
                  <p className="text-sm">Status: {payment?.payment_status || "N/A"}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push("/payments")}>
                  Back to Payments
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  )
}