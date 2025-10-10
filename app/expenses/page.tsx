import { MainLayout } from "@/components/layout/main-layout"
import { ExpenseList } from "./components/expense-list"

export default function ExpensesPage() {
  return (
    <MainLayout>
      <div className="space-y-4 p-8">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <ExpenseList />
      </div>
    </MainLayout>
  )
}