import NextAuth, { type NextAuthOptions, type User, type Account, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { AuthError } from 'firebase/auth';
import { AxiosError } from 'axios';
import { type JWT } from "next-auth/jwt";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to authenticate with backend
async function authenticateWithBackend(idToken: string) {
  const directAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    withCredentials: true,
  })

  const trimmedToken = idToken.trim()
  let cleanToken = trimmedToken
  if (cleanToken.startsWith('Bearer ')) {
    cleanToken = cleanToken.replace('Bearer ', '')
  }

  const response = await directAxios.post('auth/firebase-login/', { id_token: cleanToken })
  const userData = response.data
  if (!userData?.user?.id) {
    throw new Error('Invalid user data returned from backend')
  }

  const tokens = userData?.tokens || null
  const accessToken = tokens?.access || undefined
  const refreshToken = tokens?.refresh || undefined

  return {
    id: userData.user.id.toString(),
    email: userData.user.email,
    name: `${userData.user.first_name} ${userData.user.last_name}`,
    image: userData.user.profile_image,
    accessToken,
    refreshToken,
    role: userData.user.role,
  } as any
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        signInSource: { label: "SignIn Source", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email!, credentials.password!)
        const idToken = await userCredential.user.getIdToken()

        const user = await authenticateWithBackend(idToken)

        const source = (credentials as any)?.signInSource
        if ((user as any)?.role === 'tenant' && source !== 'tenant') {
          throw new Error('Tenants must use Tenant Sign In at /tenant/signin')
        }

        return { ...user, firebaseToken: idToken } as any
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
    signOut: '/signin'
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Account | null }) {
      if (account && user) {
        const accessToken = (user as any)?.accessToken as string | undefined
        const refreshToken = (user as any)?.refreshToken as string | undefined
        const firebaseToken = (user as any)?.firebaseToken as string | undefined
        if (!accessToken) {
          return { ...token, tokenExpiry: undefined }
        }
        const decoded = jwtDecode<{ exp: number }>(accessToken)
        const expiryTime = decoded.exp * 1000
        return { ...token, accessToken, refreshToken, firebaseToken, tokenExpiry: expiryTime } as any
      }

      if (typeof (token as any).tokenExpiry !== 'number') {
        return token
      }

      const now = Date.now()
      if (now > (token as any).tokenExpiry - 60 * 1000) {
        try {
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
            { refresh: (token as any).refreshToken }
          )
          const newAccessToken = refreshResponse.data.access
          const newDecoded = jwtDecode<{ exp: number }>(newAccessToken)
          const newExpiry = newDecoded.exp * 1000
          ;(token as any).accessToken = newAccessToken
          ;(token as any).tokenExpiry = newExpiry
        } catch {
          return { ...token, accessToken: undefined, refreshToken: undefined, tokenExpiry: undefined }
        }
      }

      return token
    },
    async session({ session, token }: { session: Session; token: any }) {
      ;(session as any).accessToken = token.accessToken
      ;(session as any).firebaseToken = token.firebaseToken
      ;(session as any).id = token.id
      ;(session as any).role = token.role
      return session
    },
    async redirect({ url, baseUrl }) {
      const isProduction = process.env.NODE_ENV === 'production'
      const productionUrl = 'https://property.infiniasync.com'
      const effectiveBaseUrl = isProduction
        ? (process.env.NEXTAUTH_URL || productionUrl)
        : (process.env.NEXTAUTH_URL || 'http://localhost:3000')

      if (url.startsWith('/')) {
        return `${effectiveBaseUrl}${url}`
      }
      if (new URL(url).origin === effectiveBaseUrl) {
        return url
      }
      return effectiveBaseUrl
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }