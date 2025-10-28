"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
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
  const { data: session } = useSession()

  const fetchUser = useCallback(async () => {
    if (!session?.firebaseToken) {
      setLoading(false)
      setUser(null)
      return
    }

    // Helper function to check if sessionid cookie exists
    const hasSessionCookie = () => {
      return document.cookie.split('; ').some(row => row.startsWith('sessionid='))
    }

    // Retry logic for cookie-based auth timing
    const fetchWithRetry = async (retries = 3, delay = 500) => {
      for (let i = 0; i < retries; i++) {
        try {
          // Check if we have the session cookie before making the request
          if (!hasSessionCookie() && i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }

          const response = await api.get('/auth/me/')
          setUser(response.data)
          setError(null)
          // Store the valid token
          if (session.firebaseToken) {
            localStorage.setItem('token', session.firebaseToken)
          }
          return
        } catch (err: any) {
          // If it's a 403 and we still have retries, wait and try again
          if (err.response?.status === 403 && i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          
          // Final attempt failed or other error
          setUser(null)
          if (err.response?.data?.detail?.includes('Token expired')) {
            // Clear the expired token
            localStorage.removeItem('token')
            window.location.href = '/signin'
          } else {
            setError('Failed to fetch user data')
          }
          break
        }
      }
    }

    try {
      await fetchWithRetry()
    } finally {
      setLoading(false)
    }
  }, [session]) // Remove 'user' from dependencies

  // Fetch user data when session changes - KEEP ONLY THIS useEffect
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

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

  // REMOVE THIS DUPLICATE useEffect
  // useEffect(() => {
  //   fetchUser()
  // }, [])

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