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

// Simplified API URL configuration
const getApiBaseUrl = () => {
  // Remove any backticks that might be in the environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://property.infiniasync.com/api/v1'
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

// Add this at the top of the file, after imports
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
let cachedSession: { token: string; timestamp: number } | null = null;

// Update the request interceptor
api.interceptors.request.use(
  async (config) => {
    // Skip interceptor for session and login endpoints to prevent loops
    if (
      config.url === 'auth/firebase-login/' ||
      config.url?.includes('/api/auth/session')
    ) {
      return config;
    }
    
    if (typeof window !== 'undefined') {
      try {
        // Check if we have a valid cached session first
        const now = Date.now();
        if (cachedSession && (now - cachedSession.timestamp) < SESSION_CACHE_DURATION) {
          config.headers['Authorization'] = `Bearer ${cachedSession.token}`;
          return config;
        }
        
        // Get a fresh session only if cache is invalid
        const session = await fetch('/api/auth/session').then(res => res.json());
        const firebaseToken = session?.firebaseToken;
        
        if (!firebaseToken) {
          // Clear cached session
          cachedSession = null;
          localStorage.removeItem('token');
          
          if (!window.location.pathname.includes('/signin')) {
            window.location.href = '/signin';
          }
          return Promise.reject('No authentication token found');
        }
        
        // Update cache and localStorage
        const trimmedToken = firebaseToken.trim();
        cachedSession = {
          token: trimmedToken,
          timestamp: now
        };
        localStorage.setItem('token', trimmedToken);
        
        config.headers['Authorization'] = `Bearer ${trimmedToken}`;
        return config;
      } catch (error) {
        console.error('Error getting auth token:', error);
        // Clear cached session on error
        cachedSession = null;
        localStorage.removeItem('token');
        
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Update the response interceptor - remove the duplicate one and combine the logic
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

      // Handle token expiration
      if (
        err.response.status === 403 &&
        err.response.data?.detail?.includes('Token expired')
      ) {
        // Clear all stored tokens and cache
        localStorage.removeItem('token')
        localStorage.removeItem('lastAuthMeCall')
        cachedSession = null;

        // Only redirect if we're not already on the signin page and in a browser context
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/signin')) {
          window.location.href = '/signin'
        }
      }
    }

    // Handle network errors
    if (err.message === 'Network Error') {
      console.error('Network error - please check your connection')
    }

    return Promise.reject(err)
  }
);

// Remove the duplicate response interceptor
export default api