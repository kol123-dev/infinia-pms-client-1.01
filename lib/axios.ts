import axios from 'axios'

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

// Dynamically determine API URL based on current environment
const getApiBaseUrl = () => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // If we're on the production server
    if (window.location.hostname === '194.163.148.34' || 
        window.location.hostname === 'rental.infiniasync.com') {
      return `http://${window.location.hostname}:8000/api/v1`
    }
    
    // Handle IPv6 localhost (::1) by converting to IPv4 (127.0.0.1)
    if (window.location.hostname === '::1' || window.location.hostname === 'localhost') {
      console.log('Converting localhost/::1 to 127.0.0.1 for API calls')
      return 'http://127.0.0.1:8000/api/v1'
    }
  }
  
  // For Docker container communication, use the service name
  if (process.env.DOCKER_CONTAINER === '1') {
    console.log('Running in Docker container, using backend service name')
    return 'http://backend:8000/api/v1'
  }
  
  // Default or server-side rendering
  // Remove any backticks that might be in the environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'
  console.log('Using API URL from environment or default:', apiUrl)
  return apiUrl.replace(/`/g, '')
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
// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Skip interceptor for auth/me calls if we're just checking status repeatedly
    if (config.url?.includes('/auth/me/') && config.method === 'get') {
      // Check if we've made this exact request recently (within last 2 seconds)
      const lastAuthMeCall = localStorage.getItem('lastAuthMeCall');
      const now = Date.now();
      
      if (lastAuthMeCall && (now - parseInt(lastAuthMeCall)) < 2000) {
        // Cancel this request to prevent endless loops
        config.cancelToken = new axios.CancelToken((cancel) => {
          cancel('Preventing duplicate /auth/me/ call');
        });
        return config;
      }
      
      // Update the timestamp for this request
      localStorage.setItem('lastAuthMeCall', now.toString());
    }
    
    // Get token from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
        // Only log for non-auth endpoints to reduce noise
        if (!config.url?.includes('/auth/me/')) {
          console.log('Added auth token to request:', config.url)
        }
      }
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Only log for non-auth endpoints to reduce noise
    if (!response.config.url?.includes('/auth/me/')) {
      console.log(`Response success [${response.status}]:`, response.config.url)
    }
    return response
  },
  async (error) => {
    console.error('Response error:', error.message)
    if (error.response) {
      console.error(`Status: ${error.response.status}, URL: ${error.config?.url}`)
      console.error('Response data:', error.response.data)
    }
    
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