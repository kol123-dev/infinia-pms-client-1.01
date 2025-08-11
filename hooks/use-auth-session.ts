import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import api from '@/lib/axios'

export function useAuthSession() {
  const { data: session, status } = useSession()
  const previousToken = useRef<string | null>(null)
  
  useEffect(() => {
    if (session?.firebaseToken && session.firebaseToken !== previousToken.current) {
      // Update the ref to track the current token
      previousToken.current = session.firebaseToken
      
      // Set the token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${session.firebaseToken}`
      
      // Store token in localStorage for backward compatibility
      const existingToken = localStorage.getItem('token')
      if (existingToken !== session.firebaseToken) {
        localStorage.setItem('token', session.firebaseToken)
      }
    }
  }, [session])
  
  return {
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  }
}