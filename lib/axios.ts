import axios, { type AxiosRequestHeaders } from 'axios'
import { toast } from '@/hooks/use-toast'
import { getSession } from 'next-auth/react'

// Simplified API URL configuration
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/`/g, '')
  }
  const isProd = process.env.NODE_ENV === 'production'
  return isProd
    ? 'https://property.infiniasync.com/api/v1'
    : 'http://localhost:8000/api/v1'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
})
api.defaults.withCredentials = true
api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

// Request interceptor: ensure cookies + CSRF + Bearer Token
api.interceptors.request.use(
  async (config) => {
    config.withCredentials = true

    // Inject Bearer token from NextAuth session
    if (typeof window !== 'undefined') {
      try {
        const session = await getSession()
        if ((session as any)?.accessToken) {
          const token = (session as any).accessToken
          const headers = config.headers || {}
          // Handle both AxiosHeaders object and plain object
          if (typeof (headers as any).set === 'function') {
            (headers as any).set('Authorization', `Bearer ${token}`)
          } else {
            (headers as any)['Authorization'] = `Bearer ${token}`
          }
          config.headers = headers
        }
      } catch (e) {
        // Ignore session fetch errors, proceed without token
      }
    }

    const method = (config.method || 'get').toLowerCase()
    if (typeof window !== 'undefined' && ['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrf = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]

      if (csrf) {
        const headers = config.headers || {}
        if (typeof (headers as any).set === 'function') {
          (headers as any).set('X-CSRFToken', csrf)
        } else {
          (headers as AxiosRequestHeaders)['X-CSRFToken'] = csrf as any
        }
        config.headers = headers
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: show toast on forbidden, redirect only on unauthorized
api.interceptors.response.use(
  (response) => response,
  async (err: any) => {
    if (err?.response) {
      const status = err.response.status
      if (status === 403) {
        toast({
          title: 'Action not permitted',
          description: (err.response.data?.detail as string) || 'You do not have permission to perform this action.',
          variant: 'destructive',
        })
      } else if (status === 401) {
        // Log the 401 error for debugging
        console.error(`[Axios] 401 Unauthorized at ${err.config.url}`);
        
        // Prevent automatic redirect loop. Just show a toast.
        // If the user is truly unauthenticated, Middleware handles the initial page load protection.
        // If the API token is invalid but the NextAuth session is active, we shouldn't force a logout.
        toast({
          title: 'Session Error',
          description: 'We could not authenticate your request. Please try refreshing the page.',
          variant: 'destructive',
        })
        
        /* 
        // Old aggressive redirect logic - causes loops
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || ''
          const isTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant')
          window.location.href = isTenantArea ? '/tenant/signin' : '/signin'
        } 
        */
      }
    }
    return Promise.reject(err)
  }
)

export default api