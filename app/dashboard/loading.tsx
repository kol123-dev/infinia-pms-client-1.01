"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"

export default function Loading() {
  return (
    <MainLayout>
      <DashboardSkeleton />
    </MainLayout>
  )
}