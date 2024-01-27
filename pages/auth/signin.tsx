import { Card, CardContent, Divider, Grid, Icon, Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { enqueueSnackbar } from "notistack";
import React from "react";
import { authOptions } from "../api/auth/[...nextauth]";

export default function ({ providers }) {
    const router = useRouter()
    const [state, setState] = React.useState({ email: '', error: '' })
    const emailProvider = providers.find(p => p.type == 'email')
    const oauthProviders = providers.filter(p => p.type == 'oauth')

    const sign = async (id: string, options?) => {
        const result = await signIn(id, {
            ...options,
            redirect: false
        })
        console.log(id)
        console.log(result)
        if (result?.error)
            enqueueSnackbar(result?.error, { variant: 'error' })
        else if (id == 'email')
            router.push('/auth/verifyrequest')
    }

    return (
        <Grid container justifyContent='center' alignContent='center' sx={{ flexGrow: 1 }}>
            <Grid item xs={8} md={4} >
                <Card >
                    <CardContent>
                        <Stack direction="column" spacing={1}>
                            {emailProvider && <React.Fragment>
                                <TextField label="Email" type="email" name="email" value={state.email} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({
                                    ...state,
                                    email: event.target.value
                                })}>
                                </TextField>
                                <Button variant="outlined" onClick={() => sign("email", { email: state.email })}>Sign in with Email</Button>
                                <Divider sx={{ padding: 2, fontSize: 10 }} >OR</Divider>
                            </React.Fragment>}
                            {oauthProviders.map((provider) => (
                                <Button startIcon={<img src={`https://authjs.dev/img/providers/${provider.id}.svg`}></img>}
                                    variant="outlined" key={provider.name} onClick={() => sign(provider.id)}>
                                    Sign in with {provider.name}
                                </Button>
                            ))}
                        </Stack>
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
        : { props: { providers: Object.values(await getProviders() ?? {}) } }
}