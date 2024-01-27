import NextAuth, { AuthOptions, Awaitable } from "next-auth"
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { AdapterUser } from "next-auth/adapters";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../../../tools/db";
import { UserRole } from "@prisma/client";

export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
        signIn: '/auth/signin',
        signOut: '/',
        error: '/auth/signin', // Error code passed in query string as ?error=
        verifyRequest: '/auth/verifyrequest', // (used for check email message)
        newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    adapter:
    {
        ...PrismaAdapter(prisma),
        createUser(data) {
            console.log('NEXTAUTH - createUser')
            const domain = data.email.split('@')[1].toLowerCase()

            if (domain == process.env.COMPANY_DOMAIN) {
                data['role'] = UserRole.ADMIN
                return (prisma.user.create({ data }) as Awaitable<AdapterUser>);
            }
            else {
                data['role'] = UserRole.USER
                return prisma.contact.findFirstOrThrow({
                    where: {
                        connectionEmails: {
                            has: data.email
                        }
                    }
                }).then(contact => {
                    data['contactId'] = contact.id;
                    return prisma.user.create({ data });
                }) as Awaitable<AdapterUser>;
            }
        }
    },
    providers: [
        EmailProvider({
            server: {
                host: process.env.NEXTAUTH_PROVIDER_EMAIL_SERVER_HOST,
                port: process.env.NEXTAUTH_PROVIDER_EMAIL_SERVER_PORT,
                auth: {
                    user: process.env.NEXTAUTH_PROVIDER_EMAIL_SERVER_USER,
                    pass: process.env.NEXTAUTH_PROVIDER_EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.NEXTAUTH_PROVIDER_EMAIL_FROM,
            maxAge: 30 * 24 * 60 * 60, // 30 days in sec
        }),
        GitHubProvider({
            clientId: process.env.NEXTAUTH_PROVIDER_GITHUB_CLIENT_ID!,
            clientSecret: process.env.NEXTAUTH_PROVIDER_GITHUB_CLIENT_SECRET!
        }),
        GoogleProvider({
            clientId: process.env.NEXTAUTH_PROVIDER_GOOGLE_CLIENT_ID!,
            clientSecret: process.env.NEXTAUTH_PROVIDER_GOOGLE_CLIENT_SECRET!
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            if (!user.email) {
                return false;
            }

            const domain = user.email.split('@')[1].toLowerCase()

            return domain == process.env.COMPANY_DOMAIN
                || await prisma.contact.findFirst({
                    where: {
                        connectionEmails: {
                            has: user.email
                        }
                    }
                }) != undefined
        },

        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },

        async session({ session, user, token }) {
            if (token) {
                session.role = token.role
                session.userId = token.userId
                // console.log(`NEXTAUTH - SESSION - set session.userId from token (${token.userId})`)
            }
            return session
        },

        async jwt({ token, user }) {
            if (user) {
                token.role = user['role']
                token.userId = user.id
                // console.log(`NEXTAUTH - JWT - set token.userId from user (${user.id})`)
            }
            return token
        }
    },
}

export default NextAuth(authOptions);