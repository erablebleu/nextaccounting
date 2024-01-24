import { UserRole } from "@prisma/client"
import NextAuth from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    export interface Session extends DefaultSession {
        userId: string,
        role: UserRole,
    }
}

declare module "next-auth/jwt" {

    export interface JWT extends Record<string, unknown>, DefaultJWT {
        userId: string,
        role: UserRole,
    }
}