import axios, { type AxiosRequestHeaders } from 'axios'
import { toast } from '@/hooks/use-toast'
import { getSession, signOut } from 'next-auth/react'
import { getHttpCache, setHttpCache, enqueueSyncAction } from '@/lib/offline/db'

let hasUnauthorizedHandled = false

// handleUnauthorized function
const handleUnauthorized = (err?: any) => {
  if (hasUnauthorizedHandled) return
  hasUnauthorizedHandled = true

  toast({
    title: 'Session Error',
    description: 'We could not authenticate your request. Please try signing in again.',
    variant: 'destructive',
  })

  if (typeof window !== 'undefined') {
    try {
      // Avoid await inside environments that complain; still redirect immediately
      void signOut({ callbackUrl: '/signin' }).catch(() => {
        const pathname = window.location.pathname || ''
        if (!pathname.startsWith('/signin')) {
          window.location.assign('/signin')
        }
      })
    } catch {
      const pathname = window.location.pathname || ''
      if (!pathname.startsWith('/signin')) {
        window.location.assign('/signin')
      }
    }
  }
}

// Simplified API URL configuration
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/`/g, '')
  }
  const isProd = process.env.NODE_ENV === 'production'
  return isProd
    ? 'https://api.infiniasync.com/api/v1'
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
  async (response) => {
    const isBrowser = typeof window !== 'undefined'
    const method = (response.config?.method || 'get').toLowerCase()

    if (isBrowser && method === 'get') {
      const key = api.getUri(response.config)
      void setHttpCache(key, response.data).catch(() => {})
    }

    return response
  },
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
        handleUnauthorized(err)
      }
      return Promise.reject(err)
    }

    const isBrowser = typeof window !== 'undefined'
    const config = err?.config
    const method = (config?.method || 'get').toLowerCase()
    const isOffline = typeof navigator !== 'undefined' && navigator?.onLine === false
    const isNetworkError = err?.code === 'ERR_NETWORK' || String(err?.message || '').toLowerCase().includes('network error')

    if (isBrowser && config && (isOffline || isNetworkError)) {
      if (method === 'get') {
        const key = api.getUri(config)
        const cached = await getHttpCache(key)
        if (cached) {
          return {
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: config,
          }
        }
      }

      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        const url = String(config.url || '')
        if (url.includes('/api/v1/')) {
          if (isOffline) {
            await enqueueSyncAction({
              method: method.toUpperCase(),
              url,
              baseURL: String(config.baseURL || api.defaults.baseURL || ''),
              headers: (config.headers as any) || {},
              params: (config.params as any) || null,
              data: (config.data as any) || null,
            })
            return {
              data: { queued: true },
              status: 202,
              statusText: 'Accepted',
              headers: {},
              config,
              request: config,
            }
          }
        }
      }
    }

    return Promise.reject(err)
  }
)

// Safety-net: also attach the same 401 handler to the global axios default instance.
// This covers any direct `import axios from 'axios'` usage that might bypass our `api`.
axios.interceptors.response.use(
  (res) => res,
  async (err: any) => {
    if (err?.response?.status === 401) {
      handleUnauthorized(err)
    }
    return Promise.reject(err)
  }
)


export default api
