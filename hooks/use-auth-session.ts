import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import api from '@/lib/axios'

export function useAuthSession() {
  const { data: session, status } = useSession()
  
  useEffect(() => {
    if (session?.firebaseToken) {
      // Set the token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${session.firebaseToken}`
      
      // Store token in localStorage for backward compatibility
      localStorage.setItem('token', session.firebaseToken)
    }
  }, [session])
  
  return {
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  }
}