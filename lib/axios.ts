import axios from 'axios'

// Log the environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

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

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // If refresh token logic is needed, implement it here
      // For now, just clear auth and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/signin'
      }
    }

    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.error('Permission denied:', error.response.data)
      // Handle forbidden access as needed
    }

    // Handle 404 Not Found errors
    if (error.response && error.response.status === 404) {
      console.error('Resource not found:', error.response.data)
      // Handle not found as needed
    }

    // Handle 500 Server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data)
      // Handle server errors as needed
    }

    // Network errors
    if (error.message === 'Network Error') {
      console.error('Network error - please check your connection')
      // Handle network errors as needed
    }

    return Promise.reject(error)
  }
)

export default api