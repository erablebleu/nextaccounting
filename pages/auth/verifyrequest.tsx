
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth'
import React from 'react'
import { authOptions } from '../api/auth/[...nextauth]'

export default function () {
    const [state, setState] = React.useState({ hostname: '' })

    React.useEffect(() => {
        setState({
            ...state,
            hostname: window.location.hostname
        })
    }, [])

    return (
        <Grid container justifyContent='center' alignContent='center' sx={{ flexGrow: 1 }}>
            <Grid item xs={8} md={4} >
                <Card >
                    <CardContent>
                        <Typography fontSize={32} textAlign='center'>Check your email</Typography>
                        <Typography margin={2} fontSize={14} textAlign='center'>A sign in link as been sent to your email address.</Typography>
                        <Typography fontSize={12} sx={{ opacity: 0.5 }} textAlign='center'>{state.hostname}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getServerSession(context.req, context.res, authOptions)

    return session
        ? { redirect: { destination: "/" } }
        : { props: {} }
}