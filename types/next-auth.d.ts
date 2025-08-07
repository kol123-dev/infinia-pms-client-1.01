import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    firebaseToken?: string
    user: {
      id: string
    } & DefaultSession["user"]
  }
  
  interface User extends DefaultUser {
    firebaseToken?: string
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firebaseToken?: string
    id: string
  }
}