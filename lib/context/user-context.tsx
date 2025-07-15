"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../axios"

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  bio: string | null
  profile_image: string | null
  country: string | null
  city_state: string | null
  is_active: boolean
  gender: string | null
  date_of_birth: string | null  // Will be in ISO format 'YYYY-MM-DD'
}

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  fetchUser: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  updatePhoto: (file: File) => Promise<void>
  clearUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      setLoading(false)
      setUser(null)
      return
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await api.get('/auth/me/')
      setUser(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching user:', err)
      setUser(null)
      setError('Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.patch('/auth/me/', data)
      setUser(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to update profile')
      console.error('Error updating profile:', err)
      throw err
    }
  }

  const updatePhoto = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('profile_image', file)
      const response = await api.patch('/auth/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setUser(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to update photo')
      console.error('Error updating photo:', err)
      throw err
    }
  }

  const clearUser = () => {
    setUser(null)
    setError(null)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        fetchUser,
        updateProfile,
        updatePhoto,
        clearUser
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}