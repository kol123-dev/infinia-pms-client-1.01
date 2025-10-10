import { useState } from "react"
import axios from "@/lib/axios"

export type Expense = {
  id: string
  name: string
  expense_type: string
  amount: number
  date: string
  description: string
  is_recurring: boolean
  calculation_type?: string
  calculation_value?: number
  property?: string
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/properties/expenses/')
      setExpenses(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const createExpense = async (data: Partial<Expense>) => {
    try {
      await axios.post('/properties/expenses/', data)
      await fetchExpenses()
    } catch (error) {
      console.error("Error creating expense:", error)
      throw error
    }
  }

  return {
    expenses,
    loading,
    fetchExpenses,
    createExpense
  }
}