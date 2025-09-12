import NextAuth, { type NextAuthOptions,type User, type Account, type Session } from "next-auth";
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

const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        provider: { label: "Provider", type: "text" },
        idToken: { label: "ID Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials) throw new Error("No credentials provided. Please try again.");
    
        try {
          let idToken: string;
    
          if (credentials.provider === "google") {
            if (!credentials.idToken) {
              throw new Error("No Google ID token provided. Please try signing in again.");
            }
            idToken = credentials.idToken;
          } else {
            try {
              const userCredential = await signInWithEmailAndPassword(
                auth,
                credentials.email,
                credentials.password
              );
              idToken = await userCredential.user.getIdToken(true);
            } catch (firebaseError) {
              const error = firebaseError as AuthError;
              if (error.code === 'auth/wrong-password') {
                throw new Error("Wrong password. Please try again.");
              } else if (error.code === 'auth/user-not-found') {
                throw new Error("No account found with this email.");
              } else if (error.code === 'auth/invalid-email') {
                throw new Error("Invalid email format.");
              } else {
                throw new Error("Authentication failed. Please check your credentials and try again.");
              }
            }
          }
    
          // Call backend authentication
          return await authenticateWithBackend(idToken);
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;  // Throw to pass custom message to frontend
        }
      }
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
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.warn('No current user for token refresh'); // Added warning
            return { ...token, firebaseToken: undefined, tokenExpiry: undefined };
          }
    
          const newIdToken = await currentUser.getIdToken(true);
          const decodedNew = jwtDecode<{ exp: number }>(newIdToken);
          const newExpiry = decodedNew.exp * 1000;
          console.log(`Refreshed token expiry: ${new Date(newExpiry).toISOString()}`); // Added logging
          const userData = await authenticateWithBackend(newIdToken);
          
          return {
            ...token,
            firebaseToken: userData.firebaseToken,
            id: userData.id,
            tokenExpiry: newExpiry
          };
        } catch (error) {
          console.error('Token refresh failed:', error);
          return { ...token, firebaseToken: undefined, tokenExpiry: undefined };
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
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(options);

export { handler as GET, handler as POST };