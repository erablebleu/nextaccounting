import { Prisma } from "@prisma/client";
import React from "react";
import { prisma } from "../../../tools/db";
import { App } from "../../../context/AppContext";
import { Box, Button, ButtonGroup, Card, CardHeader, Divider, Grid, InputAdornment, Stack, Typography } from "@mui/material";
import { Add, Preview } from "@mui/icons-material";
import EditableCard from "../../../components/EditableCard";
import { FieldOptions } from "../../../components/DynamicField";
import useSWR from "swr";
import { handleError } from "../../../tools/fetcher";
import Spinner from "../../../components/Spinner";
import { useRouter } from "next/router";
import { BankTransaction } from "../../../prisma/extensions";

const fetcher = async (url: URL) => handleError(await fetch(url, { method: 'GET' })).json()

function Revenues({ transaction, invoices }) {
    const { api } = App.useApp()
    const { data, error, mutate } = useSWR(`/api/revenues?noincludes&bankTransactionId=${transaction.id}`, fetcher, {})
    const [newItem, setNewItem] = React.useState<any | undefined>(undefined)

    if (error) return null
    if (!data) return <Spinner />

    const canAdd = data.reduce((a: Prisma.Decimal, b) => Prisma.Decimal.add(a, b.amount), new Prisma.Decimal(0)).cmp(new Prisma.Decimal(transaction.amount)) < 0

    const fields: FieldOptions[] = [{
        type: 'text',
        propertyName: 'amount',
        label: 'Amount',
        containerProps: { xs: 12, md: 6 },
        inputProps: { endAdornment: <InputAdornment position="end">€</InputAdornment>, },
    }, {
        type: 'select',
        propertyName: 'invoiceId',
        label: 'Invoice',
        containerProps: { xs: 12, md: 6 },
        selectOptions: invoices.map(invoice => ({ label: invoice.number, value: invoice.id }))
    },
    ]

    const getItemControl = (item, onEndEdition?: any, disableEdition?: boolean) => (
        <EditableCard
            key={crypto.randomUUID()}
            apiService={api.revenue}
            headerProps={{ title: invoices.find(invoice => invoice.id == item.invoiceId)?.number, subheader: App.Format.amount(item.amount) }}
            editingHeaderProps={{ title: invoices.find(invoice => invoice.id == item.invoiceId)?.number }}
            data={item}
            fields={fields}
            onChange={() => mutate()}
            onEndEdition={onEndEdition}
            disableEdition={disableEdition}
        />)

    return (
        <React.Fragment>
            <Divider />
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                <Typography sx={{ flexGrow: 1 }} variant="h5" >ASSOCIATED INVOICES</Typography>
                <Grid item sx={{ align: 'right' }}>
                    <ButtonGroup>
                        <Button disabled={!canAdd} onClick={() => setNewItem({
                            bankTransactionId: transaction.id,
                            amount: 0,
                            invoiceId: invoices[0].id
                        })}>
                            <Add />
                        </Button>
                    </ButtonGroup>
                </Grid>
            </Box>
            <Stack spacing={1}>
                {newItem && getItemControl(newItem, () => setNewItem(undefined))}
                {data.map((revenue) => getItemControl(revenue, undefined, true))}
            </Stack>
        </React.Fragment>
    )
}

function Purchases({ transaction }) {
    const { api, showPDFDialog } = App.useApp()
    const { data, error, mutate } = useSWR(`/api/purchases?bankTransactionId=${transaction.id}`, fetcher, {})
    const [newItem, setNewItem] = React.useState<any | undefined>(undefined)

    if (error) return null
    if (!data) return <Spinner />

    const canAdd = data.reduce((a: Prisma.Decimal, b) => Prisma.Decimal.sum(a, b.amount, b.vat), new Prisma.Decimal(0)).cmp(new Prisma.Decimal(transaction.amount).neg()) < 0

    const fields: FieldOptions[] = [{
        type: 'text',
        propertyName: 'amount',
        label: 'Amount',
        containerProps: { xs: 12, md: 6 },
        inputProps: { endAdornment: <InputAdornment position="end">€</InputAdornment>, },
    }, {
        type: 'text',
        propertyName: 'vat',
        label: 'VAT',
        containerProps: { xs: 12, md: 6 },
        inputProps: { endAdornment: <InputAdornment position="end">€</InputAdornment>, },
    }, {
        type: 'text',
        propertyName: 'vendor',
        label: 'Vendor',
        containerProps: { xs: 12, md: 6 },
    }, {
        type: 'text',
        propertyName: 'description',
        label: 'Description',
        containerProps: { xs: 12, md: 6 },
    }, {
        type: 'file',
        propertyName: 'file',
        label: 'File',
        containerProps: { xs: 12, md: 12 },
        hasError: (value: File | undefined) => !value,
    },
    ]

    const getItemControl = (item, onEndEdition?: any, disableEdition?: boolean) => (
        <EditableCard
            key={crypto.randomUUID()}
            apiService={api.purchase}
            headerProps={{
                title: (<React.Fragment>
                    {item.vendor}<br />
                    {item.description}
                </React.Fragment>
                ),
                subheader: `${App.Format.amount(item.amount)} (+vat: ${App.Format.amount(item.vat)})`
            }}
            data={item}
            fields={fields}
            onChange={() => mutate()}
            onEndEdition={onEndEdition}
            disableEdition={disableEdition}
            customMenu={[
                { label: 'View Attachment', icon: <Preview />, onClick: () => showPDFDialog({ url: `/api/documents/${item.attachmentId}`, allowDismiss: true }) },
            ]}
        />)

    const handleBeforeSave = async (value: any) => {
        const data = await new Promise((resolve) => {
            const fileReader = new FileReader()
            fileReader.onload = (e) => resolve(fileReader.result)
            fileReader.readAsArrayBuffer(value.file)
        })

        value.bankTransaction = { connect: { id: transaction.id } }
        value.attachment = {
            create: {
                filename: value.file.name,
                attachmentData: {
                    create: {
                        data: Buffer.from(data as ArrayBuffer).toString('base64')
                    }
                }
            }
        }
        value.file = undefined

        return value
    }

    return (
        <React.Fragment>
            <Divider />
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                <Typography sx={{ flexGrow: 1 }} variant="h5" >ASSOCIATED PURCHASES</Typography>
                <Grid item sx={{ align: 'right' }}>
                    <ButtonGroup>
                        <Button disabled={!canAdd} onClick={() => setNewItem({
                            amount: 0,
                            vat: 0,
                            vendor: '',
                            description: '',
                            file: null,
                        })}>
                            <Add />
                        </Button>
                    </ButtonGroup>
                </Grid>
            </Box>
            <Stack spacing={1}>
                {newItem && <EditableCard
                    key={crypto.randomUUID()}
                    apiService={api.purchase}
                    data={newItem}
                    fields={fields}
                    onChange={() => mutate()}
                    onEndEdition={() => setNewItem(undefined)}
                    beforeSave={handleBeforeSave}
                    customFields={
                        <React.Fragment>
                            <Box sx={{ marginTop: 1 }}>
                                <embed
                                    style={{ width: '100%', height: '300px' }}
                                    type='application/pdf'
                                    src={newItem.file instanceof File ? URL.createObjectURL(newItem.file) : ''}
                                />
                            </Box>
                        </React.Fragment>
                    }
                ></EditableCard>}

                {data.map((revenue) => getItemControl(revenue, undefined, true))}
            </Stack>
        </React.Fragment>
    )
}

export default function ({ transaction, revenues, pruchases, invoices }) {
    const { api } = App.useApp()
    const router = useRouter()

    App.useHeader(`Transaction > "${transaction.id}"`)

    return (
        <React.Fragment>
            <Stack spacing={1} margin={1}>
                <Card>
                    <CardHeader
                        title={<React.Fragment>
                            {transaction.label}<br />
                            {transaction.reference}
                        </React.Fragment>}
                        subheader={<React.Fragment>
                            {App.Format.date(transaction.settledDate)}<br />
                            {App.Format.amount(transaction.amount)}
                        </React.Fragment>}
                    >
                    </CardHeader>
                </Card>
                {BankTransaction.isCredit(transaction)
                    ? <Revenues
                        transaction={transaction}
                        invoices={invoices} />
                    : <Purchases
                        transaction={transaction}
                    />
                }
            </Stack>
        </React.Fragment>
    )
}

export async function getServerSideProps(context) {
    const id = context.params.id;

    return App.validateJSON({
        props: {
            transaction: await prisma.bankTransaction.findUnique({ where: { id: id }, include: { bankAccount: true } }),
            invoices: (await prisma.invoice.findMany({ include: { revenues: true }, orderBy: { issueDate: 'desc' } })).filter(invoice => invoice.revenues.some(revenue => revenue.bankTransactionId == id)
                || invoice.revenues.reduce((a: number, b) => a + +b.amount, 0) < (+invoice.total + +invoice.totalVAT))
        }
    })
}