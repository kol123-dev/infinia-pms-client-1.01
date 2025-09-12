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
  try {
    // Create a direct axios instance for this call to avoid interceptors
    const directAxios = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Ensure token is properly formatted - remove any whitespace
    const trimmedToken = idToken.trim();
    console.log(`Sending token to backend (length: ${trimmedToken.length})`);
    
    // Enhanced debugging
    console.log(`Token first 20 chars: ${trimmedToken.substring(0, 20)}`);
    console.log(`Token last 20 chars: ${trimmedToken.substring(trimmedToken.length - 20)}`);
    
    // Ensure we're not sending a malformed token
    let cleanToken = trimmedToken;
    if (cleanToken.startsWith('Bearer ')) {
      console.warn('Token incorrectly includes Bearer prefix, removing it');
      cleanToken = cleanToken.replace('Bearer ', '');
    }
    
    // Make sure we're sending the token in the correct format
    const response = await directAxios.post('auth/firebase-login/', {
      id_token: cleanToken
    });

    const userData = response.data;

    if (!userData?.user?.id) {
      throw new Error('Invalid user data returned from backend');
    }

    return {
      id: userData.user.id.toString(),
      email: userData.user.email,
      name: `${userData.user.first_name} ${userData.user.last_name}`,
      image: userData.user.profile_image,
      firebaseToken: cleanToken // Store the clean token
    };
  } catch (error) {
    console.error('Backend authentication failed:', error);
    // Enhanced error logging
    if (error && typeof error === 'object' && 'response' in error) {
      const errorResponse = (error as AxiosError).response;
      console.error(`Error status: ${errorResponse?.status}`);
      console.error('Error data:', errorResponse?.data);
    }
    throw error;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log('Authorize callback triggered');
        console.log('Runtime NEXTAUTH_URL in authorize:', process.env.NEXTAUTH_URL);
        
        // Force-set a safe callback URL early if needed
        const baseUrl = process.env.NEXTAUTH_URL || 'https://property.infiniasync.com';
        if (req?.query?.callbackUrl?.includes('0.0.0.0')) {
          console.log('Bad callback detected in authorize, overriding to:', baseUrl);
          req.query.callbackUrl = `${baseUrl}/`;  // Override to prevent bad redirect
        }

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          // First, sign in with Firebase to get ID token
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          const idToken = await userCredential.user.getIdToken();
          
          // Now authenticate with backend using the ID token
          const user = await authenticateWithBackend(idToken);
          
          if (user) {
            console.log('Authorization successful for user:', user.email);
            return user;
          }
          console.log('Authorization failed: No user returned');
          return null;
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
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
      // Initial sign in
      if (account && user) {
        if (!user.firebaseToken) {
          console.error('No firebaseToken available for decoding');
          return { ...token, tokenExpiry: undefined }; // Or handle appropriately
        }
        const decoded = jwtDecode<{ exp: number }>(user.firebaseToken);
        const expiryTime = decoded.exp * 1000; // Convert to ms
        console.log(`Initial token expiry: ${new Date(expiryTime).toISOString()}`); // Added logging
        return {
          ...token,
          firebaseToken: user.firebaseToken,
          id: user.id,
          tokenExpiry: expiryTime
        };
      }
    
      // Return early if no token expiry is set
      if (typeof token.tokenExpiry !== 'number') {
        return token;
      }
    
      // Refresh 5 minutes before actual expiry
      const REFRESH_THRESHOLD = 5 * 60 * 1000;
      if (Date.now() > (token.tokenExpiry - REFRESH_THRESHOLD)) {
        const maxRetries = 3;
        let attempts = 0;
        while (attempts < maxRetries) {
          try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
              console.warn('No current user for token refresh - possibly logged out or session expired');
              return { ...token, firebaseToken: undefined, tokenExpiry: undefined };
            }
    
            // Add timeout to prevent hanging on network issues
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Token refresh timeout')), 10000) // 10s timeout
            );
    
            const refreshPromise = currentUser.getIdToken(true);
            const newIdToken = await Promise.race([timeoutPromise, refreshPromise]) as string;
    
            const decodedNew = jwtDecode<{ exp: number }>(newIdToken);
            const newExpiry = decodedNew.exp * 1000;
            console.log(`Refreshed token expiry: ${new Date(newExpiry).toISOString()}`);
            const userData = await authenticateWithBackend(newIdToken);
    
            return {
              ...token,
              firebaseToken: userData.firebaseToken,
              id: userData.id,
              tokenExpiry: newExpiry
            };
          } catch (error: unknown) {
            attempts++;
            const errorDetails = {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: (error instanceof Error && 'code' in error) ? (error as { code?: string }).code : 'unknown',
              stack: error instanceof Error ? error.stack : undefined,
              firebaseConfigLoaded: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY // Check if env vars are present
            };
            console.error(`Token refresh attempt ${attempts} failed with details:`, errorDetails);
            if (attempts >= maxRetries) {
              console.error('Max retries reached for token refresh - forcing re-authentication');
              return { ...token, firebaseToken: undefined, tokenExpiry: undefined };
            }
            // Exponential backoff: Wait longer each time (1s, 2s, 4s)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      }
    
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Send properties to the client
      session.firebaseToken = token.firebaseToken;
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
    // Updated redirect with proper typing
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback triggered'); // Confirm if this is even called
      console.log('Runtime NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
      console.log('Incoming url:', url);
      console.log('Base URL:', baseUrl);

      const isProduction = process.env.NODE_ENV === 'production';
      const productionUrl = 'https://property.infiniasync.com';
      const effectiveBaseUrl = isProduction 
        ? (process.env.NEXTAUTH_URL || productionUrl) 
        : (process.env.NEXTAUTH_URL || 'http://localhost:3000');

      console.log('Effective base URL calculated:', effectiveBaseUrl);

      if (url.startsWith('/')) {
        return `${effectiveBaseUrl}${url}`;
      }
      if (new URL(url).origin === effectiveBaseUrl) {
        return url;
      }
      return effectiveBaseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };