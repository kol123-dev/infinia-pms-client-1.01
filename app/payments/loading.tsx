import { MainLayout } from "@/components/layout/main-layout"
import { PaymentsSkeleton } from "@/components/payments/PaymentsSkeleton"

export default function Loading() {
  return (
    <MainLayout>
      <PaymentsSkeleton />
    </MainLayout>
  )
}
