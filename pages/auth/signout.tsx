
import { getServerSession } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSidePropsContext } from 'next'

export default function () {
    useEffect(() => {
        signOut({
            redirect: true,
            callbackUrl: '/',
        })
    })

    return undefined
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getServerSession(context.req, context.res, authOptions)

    return session
        ? { props: {} }
        : { redirect: { destination: "/" } }
}