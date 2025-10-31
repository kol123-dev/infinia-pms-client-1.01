import { MainLayout } from "@/components/layout/main-layout"
import { PropertiesSkeleton } from "@/components/properties/PropertiesSkeleton"

export default function Loading() {
  return (
    <MainLayout>
      <PropertiesSkeleton />
    </MainLayout>
  )
}