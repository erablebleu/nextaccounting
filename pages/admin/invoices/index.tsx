import React from "react";
import useSWR from "swr";
import { DataGrid, GridActionsCellItem, GridColDef, GridSlotsComponentsProps, GridToolbarExport } from "@mui/x-data-grid";
import { Box, Button, ButtonGroup, Card, CardHeader, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { Add, Cancel, Check, ContentCopy, Delete, Details, Download, Edit, Link, Preview, Remove, Visibility } from "@mui/icons-material";
import dayjs from "dayjs";
import { getFetcher } from "../../../tools/fetcher";
import { App } from "../../../context/AppContext";
import Spinner from "../../../components/Spinner";
import { InvoiceState } from "../../../tools/enums";
import { Invoice } from "../../../prisma/extensions";
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
            <GridToolbarExport/>
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

export default function Invoices() {
    const router = useRouter()
    const { year, defaultErrorHandler, showPDFDialog, api, enqueueSnackbar, showDialog, copyShareLink } = App.useApp()
    const { data, error, mutate } = useSWR(`/api/invoices?y=${year}`, getFetcher, {})

    const handleAdd = async (id?: string | undefined) => {
        api.invoice.create({ id })
            .then(async (res: Response) => {
                enqueueSnackbar(`Item successfully created !`, { variant: 'success' })
                router.push(`/admin/invoices/${(await res.json()).id}`)
            })
            .catch(defaultErrorHandler)
    }
    const handleEdit = async (id: any) => {
        router.push(`/admin/invoices/${id}`)
    }
    const handleDelete = async (invoice: any) => {
        const answer = await showDialog({
            title: 'Invoice deletion',
            message: `Are you sure you wants to delete this invoice ?`,
            actions: [{ caption: 'cancel' }, { caption: 'confirm' }]
        })

        switch (answer?.caption) {
            case 'confirm':
                api.invoice.delete(invoice.id)
                    .then((res: Response) => {
                        enqueueSnackbar(`Item successfully deleted !`, { variant: 'success' })
                        mutate()
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }

    App.useHeader('Invoices')
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
        { field: 'executionDate', headerName: 'Date', width: 90, renderCell: App.DataGrid.Renderers.date },
        // { field: 'title', flex: 1, headerName: 'Title', },
        {
            field: 'state', headerName: 'Payment', flex: 1, align: 'right', renderCell: (params) => {
                const dayCnt = dayjs().diff(dayjs(params.row.executionDate), 'days')

                switch(params.row.state) {
                    case InvoiceState.DRAFT: return <Tooltip title="Draft"><Edit /></Tooltip> 
                    case InvoiceState.CANCELED: return <Tooltip title="Canceled"><Cancel color="error" /></Tooltip> 
                }

                if (Invoice.isFullyPaid(params.row)) {
                    return <React.Fragment>
                        <Typography color="success.main">
                            {App.Format.date(params.row.revenues[0].bankTransaction.settledDate)}
                            <Check />
                        </Typography>
                    </React.Fragment>
                } else if (dayCnt > +params.row.paymentDelay) { // retard
                    return <React.Fragment >
                        <Typography color="error">
                            {dayCnt - +params.row.paymentDelay}d late
                        </Typography>
                    </React.Fragment>
                }
                else {
                    return <React.Fragment>
                        <LinearProgress value={dayCnt * 100 / +params.row.paymentDelay} sx={{ minWidth: 50, mr: 1, flexGrow: 1 }} variant="determinate" />
                        {dayCnt}/{params.row.paymentDelay}d
                    </React.Fragment>
                }
            }
        },
        { field: 'total', headerName: 'Total', width: 120, renderCell: App.DataGrid.Renderers.amount, align: 'right', },
        { field: 'totalVAT', headerName: 'VAT', width: 120, renderCell: App.DataGrid.Renderers.amount, align: 'right' },
        {
            type: 'actions', width: 50, field: 'actions', getActions: (params) => Invoice.isDraft(params.row)
                ? [
                    <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => handleEdit(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<ContentCopy />} label="Duplicate" onClick={() => handleAdd(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<Delete />} disabled={params.row.state != InvoiceState.DRAFT} label="Delete" onClick={() => handleDelete(params.row)} showInMenu />,
                ]
                : [
                    <GridActionsCellItem icon={<Edit />} label="Details" onClick={() => handleEdit(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<Link />} label="Copy Public Link" onClick={() => copyShareLink(params.row.attachmentId)} showInMenu />,
                    <GridActionsCellItem icon={<ContentCopy />} label="Duplicate" onClick={() => handleAdd(params.row.id)} showInMenu />,
                    <GridActionsCellItem icon={<Preview />} disabled={params.row.state == InvoiceState.DRAFT} label="Preview" onClick={() => showPDFDialog({ url: `/api/documents/${params.row.attachmentId}`, allowDismiss: true })} showInMenu />,
                    <GridActionsCellItem icon={<Download />} disabled={params.row.state == InvoiceState.DRAFT} label="Download" onClick={() => App.download(`/api/documents/${params.row.attachmentId}`, defaultErrorHandler)} showInMenu />,
                ]
        }
    ];


    return (
        <React.Fragment>
            <DataGrid
                density="compact"
                rows={data}
                columns={columns}


                disableColumnFilter
                disableColumnMenu
                rowSelection
                disableRowSelectionOnClick
                disableDensitySelector
                disableVirtualization
                disableColumnSelector


                sortingMode="client"
                initialState={{ sorting: { sortModel: [{ field: 'executionDate', sort: 'desc' }] } }}
                slots={{
                    footer: footer
                }}
                slotProps={{
                    footer: {
                        total: Prisma.Decimal.sum(0, ...data.map(p => new Prisma.Decimal(p.total))),
                        totalVAT: Prisma.Decimal.sum(0, ...data.map(p => new Prisma.Decimal(p.totalVAT))),
                    }
                }}


            // disableRowSelectionOnClick

            // isCellEditable={() => false}
            // disableDensitySelector

            />
        </React.Fragment>
    )
}