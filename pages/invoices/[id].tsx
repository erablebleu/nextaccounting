import { UserRole } from "@prisma/client";
import React from "react";
import { Box, Button, ButtonGroup, Card, CardHeader, Divider, Grid, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { App } from "../../context/AppContext";
import { prisma } from "../../tools/db";
import { getSession } from "next-auth/react";

export default function ({ invoice, invoiceItems, revenues }) {
    App.useHeader(`INVOICES`)

    return (
        <Stack margin={1} spacing={1}>
            <Card>
                <CardHeader title="client invoice" />
            </Card>
        </Stack>
    )
}

export async function getServerSideProps(context) {
    const session = await getSession(context)

    console.log('getServerSideProps')
    console.log(session)
    
    if (!session) {
        return {
          redirect: {
            destination: '/api/auth/signin',
            permanent: false,
          },
        }
      }

    const invoice = await prisma.invoice.findFirst({
        where: { 
            id: context.params.id,
            customer: {
                contacts: {
                    some: {
                        user: {
                            id : session.userId
                        }
                    }
                }
            }
        },
        include: { revenues: { include: { bankTransaction: true }}}
    })

    console.log('invoice')
    console.log(invoice)

    if (!invoice) {
        return {
            redirect: {
                destination: '/invoices',
                permanent: false,
            },
        }
    }

    return App.validateJSON({ props: { invoice: invoice } })
}