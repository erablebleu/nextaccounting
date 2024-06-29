import React from "react";
import { Button, ButtonGroup, Card, CardHeader, Divider, LinearProgress, Stack, Typography } from "@mui/material";
import { FieldOptions } from "../../../components/DynamicField";
import EditionCard from "../../../components/EditionCard";
import { Cancel, Check, Download, Link, Lock as LockIcon, Preview } from "@mui/icons-material";
import { prisma } from "../../../tools/db";
import { App } from "../../../context/AppContext";
import { Invoice } from "../../../prisma/extensions";
import { useRouter } from "next/router";
import InvoiceItems from "../../../components/InvoiceItems";
import dayjs from "dayjs";
import { Prisma } from "@prisma/client";

export default function ({ invoice, revenues, customers }) {
    const router = useRouter()
    const [state, setState] = React.useState(invoice)
    const { api, enqueueSnackbar, defaultErrorHandler, showPDFDialog, showDialog, copyShareLink } = App.useApp()
    const disabled = !Invoice.isDraft(state)

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
        type: 'date',
        propertyName: 'executionDate',
        label: 'Execution',
        containerProps: { xs: 12, md: 3 },
    }, {
        type: 'text',
        propertyName: 'paymentDelay',
        label: 'Payment Delay',
        containerProps: { xs: 12, md: 3 },
        validate: value => Number(value)
    },
    ]

    const handleLock = async () => {
        const result = await showPDFDialog({
            url: `/api/invoices/preview/${invoice.id}`,
            allowDismiss: false,
            actions: [
                { caption: 'cancel' },
                { caption: 'generate' },
            ]
        })

        switch (result?.caption) {
            case 'generate':
                fetch(`/api/invoices/generate/${invoice.id}`)
                    .then(async (res: Response) => {
                        enqueueSnackbar(`Invoice successfully validated !`, { variant: 'success' })
                        setState(await res.json())
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }

    const handleSave = async (state: any) => {
        await api.invoice.update(state.id, state)
            .then((res: Response) => {
                enqueueSnackbar(`Item successfully updated !`, { variant: 'success' })
                setState(state)
            })
            .catch(defaultErrorHandler)
    }

    const handleCancel = async () => {
        const result = await showDialog({
            title: `Are you sure you want to cancel invoice N°${invoice.number} ?`,
            actions: [
                { caption: 'cancel' },
                { caption: 'validate' },
            ]
        })

        switch (result?.caption) {
            case 'validate':
                fetch(`/api/invoices/cancel/${invoice.id}`)
                    .then(async (res: Response) => {
                        enqueueSnackbar(`Invoice successfully canceled !`, { variant: 'success' })
                        setState(await res.json())
                    })
                    .catch(defaultErrorHandler)
                break;
        }
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

    const getPaymentState = () => {
        const dayCnt = dayjs().diff(dayjs(state.executionDate), 'days')
        if (Prisma.Decimal.add(state.total, state.totalVAT).eq(Prisma.Decimal.sum(0, ...revenues.map(r => r.amount)))) {
            return <React.Fragment>
                <Typography color="success.main">
                    {App.Format.date(revenues[0].bankTransaction.settledDate)}
                    <Check />
                </Typography>
            </React.Fragment>
        } else if (dayCnt > +state.paymentDelay) { // retard
            return <React.Fragment >
                <Typography color="error">
                    {dayCnt - +state.paymentDelay}d late
                </Typography>
            </React.Fragment>
        }
        else {
            return <React.Fragment>
                <LinearProgress value={dayCnt * 100 / +state.paymentDelay} sx={{ minWidth: 50, mr: 1, flexGrow: 1 }} variant="determinate" />
                {dayCnt}/{state.paymentDelay}d
            </React.Fragment>
        }
    }

    App.useHeader(`Invoice ${state.number ?? ''}`)
    App.useActions((
        <ButtonGroup sx={{ margin: 0, height: '45px' }} variant="outlined">
            {Invoice.isDraft(state) &&
                <Button title="Lock" onClick={handleLock}>
                    <LockIcon />
                </Button>
            }
            {Invoice.isLocked(state) &&
                <Button title="Cancel" onClick={handleCancel}>
                    <Cancel color="error" />
                </Button>
            }
            {(Invoice.isLocked(state) || Invoice.isImported(state)) &&
                <Button title="Copy Public Link" onClick={() => copyShareLink(state.attachmentId)}>
                    <Link />
                </Button>
            }
            {(Invoice.isLocked(state) || Invoice.isImported(state)) &&
                <Button title="Preview" onClick={() => showPDFDialog({ url: `/api/documents/${state.attachmentId}`, allowDismiss: true })}>
                    <Preview />
                </Button>
            }
            {(Invoice.isLocked(state) || Invoice.isImported(state)) &&
                <Button title="Download" onClick={() => App.download(`/api/documents/${state.attachmentId}`, defaultErrorHandler)}>
                    <Download />
                </Button>
            }
        </ButtonGroup>
    ), [state])

    return (
        <Stack margin={1} spacing={1}>
            {!Invoice.isDraft(state) && <Card>
                <CardHeader subheader={getPaymentState()} />
            </Card>
            }
            <EditionCard
                headerProps={{
                    title: `${state.number ?? ''}`,
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
                defaultProperties={{ invoiceId: invoice.id }}
                url={`/api/invoiceitems?invoiceId=${invoice.id}`}
                disabled={disabled} />

            {revenues.length > 0 && (<React.Fragment>
                <Divider />
                <Typography variant="h5" >REVENUES</Typography>
                {revenues.map((revenue: any) => (
                    <Card key={crypto.randomUUID()}>
                        <CardHeader
                            title={App.Format.amount(revenue.amount)}
                            subheader={App.Format.date(revenue.bankTransaction.settledDate)}
                        />
                    </Card>
                ))}

            </React.Fragment>)}
        </Stack>
    )
}

export async function getServerSideProps(context) {
    const id = context.params.id

    return App.validateJSON({
        props: {
            invoice: await prisma.invoice.findUnique({ where: { id: id } }),
            revenues: await prisma.revenue.findMany({ where: { invoiceId: id }, include: { bankTransaction: true } }),
            customers: await prisma.customer.findMany(),
        }
    })
}