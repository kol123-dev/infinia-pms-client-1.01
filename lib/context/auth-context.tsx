"use client"

import { signIn, signOut, useSession } from 'next-auth/react'
import { createContext, useContext, useState } from "react"
import { useUser } from "./user-context"
import { useAuthSession } from "@/hooks/use-auth-session"

interface AuthContextType {
  loading: boolean
  error: string | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchUser, clearUser } = useUser()
  const { isLoading } = useAuthSession()

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError(result.error)
        throw new Error(result.error)
      }
      
      await fetchUser()
      setError(null)
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in with email')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      await signIn('google', { redirect: false })
      await fetchUser()
      setError(null)
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Failed to sign in with Google')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      clearUser()
      setError(null)
    } catch (err) {
      console.error('Logout error:', err)
      throw new Error('Failed to logout')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        loading: loading || isLoading,
        error,
        signInWithEmail,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}