import React from "react";
import { App } from "../../../context/AppContext";
import { getFetcher } from "../../../tools/fetcher";
import useSWR from "swr";
import Spinner from "../../../components/Spinner";
import { DataGrid, GridActionsCellItem, GridColDef, GridSlotsComponentsProps, GridToolbarExport } from "@mui/x-data-grid";
import { Prisma } from "@prisma/client";
import { Box, Stack, Typography } from "@mui/material";
import { Delete, Preview } from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
import { useRouter } from "next/router";

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

export default function () {
    const { year, api, showDialog, defaultErrorHandler, showPDFDialog } = App.useApp()
    const { data, error, mutate } = useSWR(`/api/purchases?y=${year}`, getFetcher, {})
    const router = useRouter()

    App.useHeader('PURCHASES')

    if (error) return null
    if (!data) return <Spinner />

    const handleDelete = async (id: string) => {
        const answer = await showDialog({
            title: 'Purchase entry deletion',
            message: `Are you sure you wants to delete purchase entry ?`,
            actions: [{ caption: 'cancel' }, { caption: 'confirm' }]
        })

        switch (answer?.caption) {
            case 'confirm':
                await api.purchase.delete(id)
                    .then((res: Response) => {
                        enqueueSnackbar(`Item successfully deleted !`, { variant: 'success' })
                        mutate()
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }

    const columns: GridColDef[] = [
        { field: 'date', headerName: 'Date', width: 90, valueGetter: (params) => params.row.bankTransaction.settledDate, renderCell: App.DataGrid.Renderers.date, },
        { field: 'label', headerName: 'Label', flex: 1, valueGetter: (params) => params.row.bankTransaction.label },
        { field: 'reference', headerName: 'Reference', flex: 2, valueGetter: (params) => params.row.bankTransaction.reference },
        { field: 'vendor', headerName: 'Vendor', width: 90 },
        { field: 'attachment', headerName: 'Attachment', flex: 2, valueGetter: (params) => params.value.filename },
        { field: 'amount', headerName: 'Amount', align: 'right', width: 120, renderCell: App.DataGrid.Renderers.amount },
        { field: 'vat', headerName: 'VAT', align: 'right', width: 120, renderCell: App.DataGrid.Renderers.amount },
        {
            type: 'actions', field: 'actions', width: 50, getActions: (params) => [
                <GridActionsCellItem icon={<Preview/>} label="View Attachment" onClick={() => showPDFDialog({ url: `/api/documents/${params.row.attachmentId}`, allowDismiss: true })} showInMenu />,
                // <GridActionsCellItem icon={App.Icons.Purchase} label="View Details" onClick={() => router.push(`/admin/purchases/${params.row.id}`)} showInMenu />,
                <GridActionsCellItem icon={App.Icons.BankTransaction} label="View Transaction" onClick={() => router.push(`/admin/banktransactions/${params.row.bankTransactionId}`)} showInMenu />,
                <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => handleDelete(params.id as string)} showInMenu />,
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
                initialState={{ sorting: { sortModel: [{ field: 'date', sort: 'desc' }] } }}
                slots={{
                    footer: footer
                }}
                slotProps={{
                    footer: {
                        total: Prisma.Decimal.sum(0, ...data.map(p => new Prisma.Decimal(p.amount))),
                        totalVAT: Prisma.Decimal.sum(0, ...data.map(p => new Prisma.Decimal(p.vat))),
                    }
                }}
            />
        </React.Fragment>
    );
}