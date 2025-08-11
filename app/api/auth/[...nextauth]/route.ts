import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider } from "firebase/auth"
import api from "@/lib/axios"

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Add this before initializing Firebase 
try {
  console.log('Firebase config:', JSON.stringify({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓' : '✗',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓' : '✗',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓' : '✗',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✓' : '✗',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓' : '✗',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? '✓' : '✗'
  }));
} catch (error) {
  console.error('Error logging Firebase config:', error);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

const handler = NextAuth({
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
        if (!credentials) {
          console.log("No credentials provided");
          return null;
        }
        
        try {
          let userCredential;
          let idToken;
          
          console.log("Authenticating with provider:", credentials.provider || "email");
          
          // Handle different authentication methods
          if (credentials.provider === "google") {
            // This is a placeholder - actual Google auth happens client-side
            // and the token is passed here
            if (!credentials.idToken) {
              console.error("No ID token provided for Google authentication");
              return null;
            }
            idToken = credentials.idToken;
          } else {
            // Email/password authentication
            userCredential = await signInWithEmailAndPassword(
              auth,
              credentials.email,
              credentials.password
            );
            idToken = await userCredential.user.getIdToken();
          }
          
          console.log("ID token obtained, sending to backend");
          
          // Send token to backend
          try {
            const response = await api.post('/auth/firebase-login/', { id_token: idToken });
            const userData = response.data;
            
            if (!userData || !userData.user || !userData.user.id) {
              console.error("Invalid user data returned from API:", userData);
              throw new Error('Invalid user data returned from backend .');
            }
            
            console.log("Authentication successful, user data received");
            
            // Return user object for the session
            return {
              id: userData.user.id.toString(),
              email: userData.user.email,
              name: `${userData.user.first_name} ${userData.user.last_name}`,
              image: userData.user.profile_image,
              firebaseToken: idToken
            };
          } catch (error) {
            console.error("API error:", error);
            // Type check the error before accessing properties
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response: { data: any; status: number } };
              console.error("Response data:", axiosError.response.data);
              console.error("Response status:", axiosError.response.status);
            }
            // Add this line to log the error message
            console.error("Authentication failed with error:", error instanceof Error ? error.message : 'Unknown error');
            throw new Error(
              error instanceof Error ? error.message : 'Failed to authenticate with backend'
            );
          }
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/signin',
    error: '/signin',  // Error code passed in query string as ?error=
  },
  callbacks: {
    async jwt({ token, user }) {
      // Pass the Firebase token to the JWT
      if (user) {
        token.firebaseToken = user.firebaseToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the Firebase token to the session
      session.firebaseToken = token.firebaseToken;
      session.user.id = token.id;
      
      // Remove this code as it's now handled by useAuthSession
      // if (typeof window !== "undefined" && token.firebaseToken) {
      //   localStorage.setItem("token", token.firebaseToken);
      //   document.cookie = `firebaseToken=${token.firebaseToken}; path=/; max-age=3600; secure; samesite=strict`;
      // }
      
      return session;
    }
  },
  session: {
    strategy: "jwt"
  }
});

export { handler as GET, handler as POST };