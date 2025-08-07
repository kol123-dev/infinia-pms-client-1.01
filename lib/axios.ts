import axios from 'axios'

// Dynamically determine API URL based on current environment
const getApiBaseUrl = () => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // If we're on the production server
    if (window.location.hostname === '194.163.148.34' || 
        window.location.hostname === 'rental.infiniasync.com') {
      return `http://${window.location.hostname}:8000/api/v1`
    }
  }
  // Default or server-side rendering
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
})
console.log('Axios baseURL:', api.defaults.baseURL)

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Remove baseURL for full URLs (like media URLs)
    if (config.url?.startsWith('http')) {
      config.baseURL = ''
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log errors if we have a token (authenticated state)
    const token = localStorage.getItem('token')
    if (token && error.response?.status !== 403) {
      console.error('Response error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      })
    }
    return Promise.reject(error)
  }
)

export default api