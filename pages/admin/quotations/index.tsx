import React from "react";
import useSWR from "swr";
import { DataGrid, GridActionsCellItem, GridColDef, GridSlotsComponentsProps, GridToolbarExport } from "@mui/x-data-grid";
import { Box, Button, ButtonGroup, Card, CardHeader, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { Add, Cancel, Check, ContentCopy, Delete, Details, Download, Edit, Link, Preview, Remove, Visibility } from "@mui/icons-material";
import dayjs from "dayjs";
import { getFetcher } from "../../../tools/fetcher";
import { App } from "../../../context/AppContext";
import Spinner from "../../../components/Spinner";
import { InvoiceState, QuotationState } from "../../../tools/enums";
import { Invoice, Quotation } from "../../../prisma/extensions";
import { useRouter } from "next/router";
import { Prisma } from "@prisma/client";

declare module '@mui/x-data-grid' {
    interface FooterPropsOverrides {
        total: Prisma.Decimal
        totalVAT: Prisma.Decimal
    }
}

function footer(props: NonNullable<GridSlotsComponentsProps['footer']>) {
    return (<React.Fragment>
        <Stack padding={1} alignContent='right' sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
            <GridToolbarExport />
            <Box sx={{ flexGrow: 1 }} />
            <Typography align='right' width={120}>
                TOTAL
            </Typography>
            <Typography align='right' width={120}>
                {App.Format.amount(props.total)}
            </Typography>
            <Typography align='right' width={120}>
                {App.Format.amount(props.totalVAT)}
            </Typography>
            <Box width={50} />
        </Stack>
    </React.Fragment>)
}

export default function () {
    const router = useRouter()
    const { year, defaultErrorHandler, showPDFDialog, api, enqueueSnackbar, showDialog, copyShareLink } = App.useApp()
    const { data, error, mutate } = useSWR(`/api/quotations?y=${year}`, getFetcher, {})

    const handleAdd = async (id?: string | undefined) => {
        api.quotation.create({ id })
            .then(async (res: Response) => {
                enqueueSnackbar(`Item successfully created !`, { variant: 'success' })
                router.push(`/admin/quotations/${(await res.json()).id}`)
            })
            .catch(defaultErrorHandler)
    }
    const handleEdit = async (id: any) => {
        router.push(`/admin/quotations/${id}`)
    }
    const handleDelete = async (quotation: any) => {
        const answer = await showDialog({
            title: 'Quotation deletion',
            message: `Are you sure you wants to delete this quotation ?`,
            actions: [{ caption: 'cancel' }, { caption: 'confirm' }]
        })

        switch (answer?.caption) {
            case 'confirm':
                api.quotation.delete(quotation.id)
                    .then((res: Response) => {
                        enqueueSnackbar(`Item successfully deleted !`, { variant: 'success' })
                        mutate()
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }
    const handleAsInvoice = async (id: any) => {
        fetch(`/api/quotations/asinvoice/${id}`)
            .then(async (res: Response) => {
                enqueueSnackbar(`Invoice successfully created !`, { variant: 'success' })
                router.push(`/admin/invoices/${(await res.json()).id}`)
            })
            .catch(defaultErrorHandler)
    }

    App.useHeader('Quotations')
    App.useActions((
        <React.Fragment>
            <Button onClick={() => handleAdd()}>
                <Add />
            </Button>
        </React.Fragment>
    ), [data])

    if (error) return null
    if (!data) return <Spinner />

    const columns: GridColDef[] = [
        { field: 'customer', headerName: 'Customer', flex: 1, valueGetter: (params) => params.value.name },
        { field: 'number', headerName: 'Number', width: 120 },
        { field: 'title', headerName: 'Title', flex: 1 },
        { field: 'issueDate', headerName: 'Date', width: 90, renderCell: App.DataGrid.Renderers.date },
        // { field: 'title', flex: 1, headerName: 'Title', },
        {
            field: 'state', headerName: '', width: 50, align: 'right', renderCell: (params) => {
                switch (params.row.state) {
                    case QuotationState.DRAFT: return <Tooltip title="Draft"><Edit /></Tooltip>
                    case QuotationState.ACCEPTED: return <Tooltip title="Accepted"><Check color="success" /></Tooltip>
                    case QuotationState.DENIED: return <Tooltip title="Denied"><Cancel color="error" /></Tooltip>
                }

                return null
            }
        },
        { field: 'total', headerName: 'Total', width: 120, renderCell: App.DataGrid.Renderers.amount, align: 'right', },
        { field: 'totalVAT', headerName: 'VAT', width: 120, renderCell: App.DataGrid.Renderers.amount, align: 'right' },
        {
            type: 'actions', width: 50, field: 'actions', getActions: (params) => Quotation.isDraft(params.row)
                ? [
                    <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => handleEdit(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<ContentCopy />} label="Duplicate" onClick={() => handleAdd(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<Delete />} disabled={params.row.state != QuotationState.DRAFT} label="Delete" onClick={() => handleDelete(params.row)} showInMenu />,
                    <GridActionsCellItem icon={App.Icons.Invoice} label="As Invoice" onClick={() => handleAsInvoice(params.row.id)} showInMenu />,
                ]
                : [
                    <GridActionsCellItem icon={<Edit />} label="Details" onClick={() => handleEdit(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<Link />} label="Copy Public Link" onClick={() => copyShareLink(params.row.attachmentId)} showInMenu />,
                    <GridActionsCellItem icon={<ContentCopy />} label="Duplicate" onClick={() => handleAdd(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<Preview />} disabled={params.row.state == QuotationState.DRAFT} label="Preview" onClick={() => showPDFDialog({ url: `/api/documents/${params.row.attachmentId}`, allowDismiss: true })} showInMenu />,
                    <GridActionsCellItem icon={<Download />} disabled={params.row.state == QuotationState.DRAFT} label="Download" onClick={() => App.download(`/api/documents/${params.row.attachmentId}`, defaultErrorHandler)} showInMenu />,
                    <GridActionsCellItem icon={App.Icons.Invoice} label="As Invoice" onClick={() => handleAsInvoice(params.row.id)} showInMenu />,
                ]
        }
    ];

    return (
        <React.Fragment>
            <DataGrid
                density="compact"
                rows={data}
                columns={columns}

                sortingMode="client"
                initialState={{ sorting: { sortModel: [{ field: 'issueDate', sort: 'desc' }] } }}
                slots={{
                    footer: footer
                }}
                slotProps={{
                    footer: {
                        total: Prisma.Decimal.sum(0, ...data.map(p => new Prisma.Decimal(p.total))),
                        totalVAT: Prisma.Decimal.sum(0, ...data.map(p => new Prisma.Decimal(p.totalVAT))),
                    }
                }}
            />
        </React.Fragment>
    )
}