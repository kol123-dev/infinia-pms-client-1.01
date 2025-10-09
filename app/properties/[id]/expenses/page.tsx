import { MainLayout } from "@/components/layout/main-layout"
import { ExpenseManagement } from "../../components/expense-management"

export default function PropertyExpensesPage({ params }: { params: { id: string } }) {
  return (
    <MainLayout>
      <ExpenseManagement propertyId={params.id} />
    </MainLayout>
  )
}