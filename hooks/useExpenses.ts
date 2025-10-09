import { useState } from "react"
import axios from "@/lib/axios"

export type ExpenseFormula = {
  id: string
  property: string
  expense_type: string
  name: string
  formula: any
  is_active: boolean
}

export type Expense = {
  id: string
  property: string
  expense_formula?: ExpenseFormula
  expense_type: string
  amount: number
  date: string
  description: string
}

export type MonthlyFinancials = {
  monthly_revenue: number
  total_expenses: number
  taxable_income: number
  tax_amount: number
  net_profit: number
  expense_breakdown: Expense[]
}

export function useExpenses(propertyId: string) {
  const [formulas, setFormulas] = useState<ExpenseFormula[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [financials, setFinancials] = useState<MonthlyFinancials | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchFormulas = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/properties/expense-formulas/?property=${propertyId}`)
      setFormulas(response.data)
    } catch (error) {
      console.error("Error fetching expense formulas:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/properties/expenses/?property=${propertyId}`)
      setExpenses(response.data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyFinancials = async (month?: string) => {
    setLoading(true)
    try {
      const response = await axios.get(`/properties/expenses/monthly_summary/?property=${propertyId}${month ? `&month=${month}` : ''}`)
      setFinancials(response.data)
    } catch (error) {
      console.error("Error fetching monthly financials:", error)
    } finally {
      setLoading(false)
    }
  }

  const createFormula = async (data: Partial<ExpenseFormula>) => {
    try {
      await axios.post('/properties/expense-formulas/', {
        ...data,
        property: propertyId
      })
      await fetchFormulas()
    } catch (error) {
      console.error("Error creating expense formula:", error)
      throw error
    }
  }

  const createExpense = async (data: Partial<Expense>) => {
    try {
      await axios.post('/properties/expenses/', {
        ...data,
        property: propertyId
      })
      await fetchExpenses()
      await fetchMonthlyFinancials()
    } catch (error) {
      console.error("Error creating expense:", error)
      throw error
    }
  }

  return {
    formulas,
    expenses,
    financials,
    loading,
    fetchFormulas,
    fetchExpenses,
    fetchMonthlyFinancials,
    createFormula,
    createExpense
  }
}