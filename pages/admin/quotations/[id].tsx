import React from "react";
import { Box, Button, ButtonGroup, Card, CardHeader, Divider, Grid, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { FieldOptions } from "../../../components/DynamicField";
import EditionCard from "../../../components/EditionCard";
import { Add, Cancel, Check, Close, Link, Lock, Lock as LockIcon } from "@mui/icons-material";
import { prisma } from "../../../tools/db";
import { App } from "../../../context/AppContext";
import { Invoice, Quotation } from "../../../prisma/extensions";
import { useRouter } from "next/router";
import InvoiceItems from "../../../components/InvoiceItems";

export default function ({ quotation, customers }) {
    const router = useRouter()
    const [state, setState] = React.useState(quotation)
    const { api, enqueueSnackbar, defaultErrorHandler, showPDFDialog, showDialog, copyShareLink } = App.useApp()
    const disabled = !Quotation.isDraft(state)

    const fields: FieldOptions[] = [{
        type: 'text',
        propertyName: 'title',
        label: 'Title',
        containerProps: { xs: 12, md: 12 },
        controlProps: { multiline: true },
    }, {
        type: 'select',
        propertyName: 'customerId',
        label: 'Customer',
        containerProps: { xs: 12, md: 3 },
        selectOptions: customers.map(customer => ({ label: customer.name, value: customer.id }))
    }, {
        type: 'date',
        propertyName: 'issueDate',
        label: 'Issue',
        containerProps: { xs: 12, md: 3 },
    }, {
        type: 'text',
        propertyName: 'validity',
        label: 'Validity',
        containerProps: { xs: 12, md: 3 },
    },
    ]

    const handleLock = async () => {
        const result = await showPDFDialog({
            url: `/api/quotations/preview/${quotation.id}`,
            allowDismiss: false,
            actions: [
                { caption: 'cancel' },
                { caption: 'generate' },
            ]
        })

        switch (result?.caption) {
            case 'generate':
                fetch(`/api/quotations/generate/${quotation.id}`)
                    .then(async (res: Response) => {
                        enqueueSnackbar(`Quotation successfully validated !`, { variant: 'success' })
                        setState(await res.json())
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }

    const handleAccept = async () => {
        const result = await showDialog({
            allowDismiss: false,
            title: 'Do you want to mar this quotation as ACCEPTED ?',
            actions: [
                { caption: 'cancel' },
                { caption: 'set accepted' },
            ]
        })

        switch (result?.caption) {
            case 'set accepted':
                fetch(`/api/quotations/accept/${quotation.id}`)
                    .then(async (res: Response) => {
                        enqueueSnackbar(`Quotation successfully accepted !`, { variant: 'success' })
                        setState(await res.json())
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }

    const handleDeny = async () => {
        const result = await showDialog({
            allowDismiss: false,
            title: 'Do you want to mar this quotation as DENIED ?',
            actions: [
                { caption: 'cancel' },
                { caption: 'set denied' },
            ]
        })

        switch (result?.caption) {
            case 'set denied':
                fetch(`/api/quotations/deny/${quotation.id}`)
                    .then(async (res: Response) => {
                        enqueueSnackbar(`Quotation successfully denied !`, { variant: 'success' })         
                        setState(await res.json())
                    })
                    .catch(defaultErrorHandler)
                break;
        }    
    }

    const handleSave = async (state: any) => {
        await api.quotation.update(state.id, state)
            .then((res: Response) => {
                enqueueSnackbar(`Item successfully updated !`, { variant: 'success' })
                setState(state)
            })
            .catch(defaultErrorHandler)
    }

    const handleItemChange = async () => {
        await api.invoice.getById(state.id)
            .then(async (res: Response) => {
                const data = await res.json()
                setState?.(prev => ({
                    ...prev,
                    total: data.total,
                    totalVAT: data.totalVAT,
                }))
            }
            )
    }

    App.useHeader(`QUOTATION ${state.number ?? ''}`)
    App.useActions((
        <React.Fragment>
            {Quotation.isDraft(state) &&
                <Button title="Lock" onClick={handleLock}>
                    <LockIcon />
                </Button>
            }
            {Quotation.isLocked(state) &&
                <Button title="Accept" onClick={handleAccept}>
                    <Check color="success" />
                </Button>
            }
            {Quotation.isLocked(state) &&
                <Button title="Deny" onClick={handleDeny}>
                    <Close color="error" />
                </Button>
            }
            {!Invoice.isDraft(state) &&
                <Button title="Copy Public Link" onClick={() => copyShareLink(state.attachmentId)}>
                    <Link />
                </Button>
            }
        </React.Fragment>
    ), [state])

    return (
        <Stack margin={1} spacing={1}>
            <EditionCard
                headerProps={{
                    title: <React.Fragment>
                        {Quotation.isLocked(state) && <Lock/>}
                        {Quotation.isAccepted(state) && <Check color="success"/>}
                        {Quotation.isDenied(state) && <Cancel color="error"/>}
                        {state.number ?? ''}
                    </React.Fragment>,
                    subheader: `${App.Format.amount(state.total)} | (${App.Format.amount(state.totalVAT)} VAT)`,
                }}
                data={state}
                fields={fields}
                onSave={handleSave}
                disabled={disabled}
            >
            </EditionCard>

            <InvoiceItems
                onChange={handleItemChange}
                defaultProperties={{ quotationId: quotation.id }}
                url={`/api/invoiceitems?quotationId=${quotation.id}`}
                disabled={disabled} />
        </Stack>
    )
}

export async function getServerSideProps(context) {
    const id = context.params.id

    return App.validateJSON({
        props: {
            quotation: await prisma.quotation.findUnique({ where: { id: id } }),
            customers: await prisma.customer.findMany(),
        }
    })
}