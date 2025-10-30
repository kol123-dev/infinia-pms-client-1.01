import axios, { type AxiosRequestHeaders } from 'axios'

// Log the environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

// Add after existing console.log statements at the top
console.log('Firebase config:', JSON.stringify({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 3)}...` : '✗',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? `${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.substring(0, 5)}...` : '✗',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : '✗',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? `${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.substring(0, 5)}...` : '✗',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID.substring(0, 3)}...` : '✗',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 3)}...` : '✗',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID.substring(0, 3)}...` : '✗'
}))

// Enhanced debugging for token storage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  console.log('Token in localStorage:', token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'Not found')
  console.log('Token length:', token ? token.length : 0)
}

// Simplified API URL configuration
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl && envUrl.trim()) {
    console.log('Using API URL from environment:', envUrl)
    return envUrl.replace(/`/g, '')
  }
  // Fallbacks by environment/host
  const isProd = process.env.NODE_ENV === 'production'
  const fallback = isProd
    ? 'https://property.infiniasync.com/api/v1'
    : 'http://127.0.0.1:8000/api/v1'
  console.log('Using API URL fallback:', fallback)
  return fallback
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
})

// Always send cookies for session-based auth
api.defaults.withCredentials = true

// Request interceptor: ensure cookies + CSRF; DO NOT add Authorization
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true

    // Attach CSRF for unsafe methods
    const method = (config.method || 'get').toLowerCase()
    if (typeof window !== 'undefined' && ['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrf = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]

      if (csrf) {
        // Do not replace headers object; set safely
        const headers = config.headers || {}

        // If AxiosHeaders instance, use set(); otherwise assign directly
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
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Only log for non-auth endpoints to reduce noise
    if (!response.config.url?.includes('/auth/me/')) {
      console.log(`Response success [${response.status}]:`, response.config.url)
    }
    return response
  },
  async (err: any) => {
    console.error('Response error:', err.message)
    if (err.response) {
      console.error(`Status: ${err.response.status}, URL: ${err.config?.url}`)
      console.error('Response data:', err.response.data)

      if (err.response.status === 401 || err.response.status === 403) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/signin')) {
          window.location.href = '/signin'
        }
      }
    }

    if (err.message === 'Network Error') {
      console.error('Network error - please check your connection')
    }

    return Promise.reject(err)
  }
)

export default api