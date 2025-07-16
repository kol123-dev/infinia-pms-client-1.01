import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
})

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