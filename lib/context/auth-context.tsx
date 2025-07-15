"use client"

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { createContext, useContext, useState, useEffect } from "react"
import { useUser } from "./user-context"  // Add this import
import api from "../axios"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfj5KTDyd69duNgN5295jG0QecxxrB6Hg", // You'll get this from the console!
  authDomain: "infinia-property-erp.firebaseapp.com",
  projectId: "infinia-property-erp",
  storageBucket: "infinia-property-erp.appspot.com", // This is usually derived from your project ID
  messagingSenderId: "87919833092", // You'll get this from the console!
  appId: "<YOUR_APP_ID_HERE>", // You'll get this from the console!
  measurementId: "G-493374691" // This comes from your Google Analytics Property ID
  // If you enabled Realtime Database, you might also see:
  // databaseURL: "https://infinia-property-erp.firebaseio.com",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

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
}

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

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      
      // Store token in both cookie and localStorage
      document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; secure; samesite=strict`
      localStorage.setItem('token', idToken)
      
      // Set up token refresh
      setInterval(async () => {
        const user = auth.currentUser
        if (user) {
          const newToken = await user.getIdToken(true)
          document.cookie = `firebaseToken=${newToken}; path=/; max-age=3600; secure; samesite=strict`
          localStorage.setItem('token', newToken)
        }
      }, 3600000) // Refresh token every hour
      
      await api.post('/auth/firebase-login/', { id_token: idToken })
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
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      
      // Store token in both cookie and localStorage
      document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; secure; samesite=strict`
      localStorage.setItem('token', idToken)
      
      await api.post('/auth/firebase-login/', { id_token: idToken })
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
      await auth.signOut()
      // Clear both cookie and localStorage
      document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
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
        loading,
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