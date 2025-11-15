import axios, { type AxiosRequestHeaders } from 'axios'
import { toast } from '@/hooks/use-toast'

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
})

// Always send cookies
api.defaults.withCredentials = true

// Request interceptor: ensure cookies + CSRF
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true

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
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || ''
          const isTenantArea = path.startsWith('/dashboard/tenant') || path.startsWith('/tenant')
          window.location.href = isTenantArea ? '/tenant/signin' : '/signin'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
