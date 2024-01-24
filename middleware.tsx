import { NextFetchEvent, NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt";
import { NextMiddlewareWithAuth, NextRequestWithAuth, withAuth } from "next-auth/middleware"
import { UserRole } from "@prisma/client";


const unauthorized = () => new NextResponse('Unauthorized', { status: 401 })


export default async function middleware(request: NextRequest, event: NextFetchEvent) {
    const token = await getToken({ req: request })

    if (token && request.nextUrl.pathname == '/api/auth/signin') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return await (withAuth(
        function middleware(request: NextRequestWithAuth) {

            if (request.nextUrl.pathname.startsWith('/share')
                || request.nextUrl.pathname.startsWith('/api')) {
                return NextResponse.next()
            }

            // UNAUTHENTICATED
            if (!request.nextauth.token) {
                return NextResponse.redirect(new URL('/api/auth/signin', request.url))
            }

            // AUTHENTICATED
            const comp = request.nextUrl.pathname.split('/').filter(element => element)

            if (comp.length == 0 && request.nextauth.token.role == UserRole.ADMIN) {
                return NextResponse.redirect(new URL('/admin', request.url))
            }

            if (comp.length == 0 && request.nextauth.token.role == UserRole.USER) {
                return NextResponse.redirect(new URL('/invoices', request.url))
            }

            if (request.nextauth.token.role == UserRole.ADMIN
                || comp.length == 0
                || comp[0] == 'api') {
                return NextResponse.next()
            }

            if (comp[0] == 'admin') {
                return NextResponse.redirect(new URL('/', request.url))
            }

            return NextResponse.next()
        },
        {
            callbacks: { authorized: ({ token }) => true, },
        }
    ) as (...args: Parameters<NextMiddlewareWithAuth>) => Promise<NextResponse>)(request as NextRequestWithAuth, event)
}