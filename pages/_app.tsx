import { SessionProvider } from "next-auth/react";
import Layout from "../components/Layout";
import { SnackbarProvider } from "notistack";
import React, { ReactElement, ReactNode } from "react";
import {
    Experimental_CssVarsProvider as CssVarsProvider,
    experimental_extendTheme as extendTheme,
} from '@mui/material/styles';
import { Button, CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { App, AppContext } from "../context/AppContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb';
import DialogBoxProvider from "../context/DialogBoxContext";
import ErrorHandlerProvider from "../context/ErrorHandlerContext";
import useCookie from "../hooks/useCookie";
import '../styles/global.css'
import { NextPage } from "next";

const theme = extendTheme()

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode
  }

export default function ({
    Component,
    pageProps: { session, ...pageProps }
}) {
    const [header, setHeader] = React.useState('')
    const [year, depSetYear, setYear] = useCookie('selectedYear', new Date().getFullYear());
    const [formActions, setFormActions] = React.useState<React.ReactElement | undefined>(undefined)
    const getLayout = Component.getLayout ?? ((page) => (<Layout>{page}</Layout>))
    
    return (
        <SessionProvider session={session}>
            <CssVarsProvider theme={theme} defaultMode='system' >
                <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                        <AppContext.Provider value={{ header, setHeader, year, setYear, formActions, setFormActions }}>
                            <ErrorHandlerProvider>
                                <CssBaseline />
                                <DialogBoxProvider>
                                    {getLayout(<Component {...pageProps} />)}
                                </DialogBoxProvider>
                            </ErrorHandlerProvider>
                        </AppContext.Provider>
                    </LocalizationProvider>
                </SnackbarProvider>
            </CssVarsProvider>
        </SessionProvider>
    )
}