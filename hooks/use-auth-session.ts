import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import api from '@/lib/axios'

export function useAuthSession() {
  const { data: session, status } = useSession()
  // Remove the useEffect hook to avoid conflicting token updates
  // The Axios interceptor will handle token attachment

  return {
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  }
}