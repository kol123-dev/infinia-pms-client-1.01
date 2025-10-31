import { MainLayout } from "@/components/layout/main-layout"
import { UsersSkeleton } from "@/components/users/UsersSkeleton"

export default function Loading() {
  return (
    <MainLayout>
      <UsersSkeleton />
    </MainLayout>
  )
}