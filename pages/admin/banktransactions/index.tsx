import React from "react";
import useSWR from "swr";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import { Button, ListItemButton, Typography } from "@mui/material";
import { Add, Check, Delete, Link, Download, Edit, Menu, Preview, Remove, Settings, Sync, Visibility } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import router from "next/router";
import { App } from "../../../context/AppContext";
import Spinner from "../../../components/Spinner";
import { InvoiceState } from "../../../tools/enums";
import { Prisma, Revenue } from "@prisma/client";
import { BankTransaction } from "../../../prisma/extensions";

export default function () {
    const { year, defaultErrorHandler } = App.useApp()
    const { enqueueSnackbar } = useSnackbar()
    const fetcher = (url: URL) => fetch(url, { method: 'GET' }).then(async res => {
        if (!res.ok) {
            const error = new Error((await res.json()).error)
            throw error
        }
        return res.json()
    }).catch(defaultErrorHandler)
    const { data, error, mutate } = useSWR(`/api/banktransactions?y=${year}`, fetcher)

    const handleSync = async () => {
        await fetch('/api/banktransactions/sync')
            .then(res => res.json())
            .then(data => {
                if (data.transactions.length > 0) {
                    enqueueSnackbar(`${data.transactions.length} new transaction(s)`, { variant: 'success' })
                    mutate()
                }
                else {
                    enqueueSnackbar(`No new transaction`, { variant: 'default' })
                }

            })
            .catch(defaultErrorHandler)
    }

    App.useHeader('Bank Transactions')
    App.useActions((
        <React.Fragment>
            <Button onClick={handleSync}>
                <Sync />
            </Button>
        </React.Fragment>
    ), [data])

    if (error) return null
    if (!data) return <Spinner />

    const columns: GridColDef[] = [
        { field: 'bankAccount', headerName: 'Account', width: 100, valueGetter: (params) => params.value.label },
        { field: 'settledDate', headerName: 'Date', width: 90, renderCell: App.DataGrid.Renderers.date },
        { field: 'label', headerName: 'Label', flex: 1, },
        { field: 'reference', headerName: 'Reference', flex: 1, },
        {
            field: 'amount', headerName: 'Amount', renderCell: (params) => (
                <Typography variant="body2" color={BankTransaction.isCredit(params.row) ? 'green' : 'darkred'}>
                    {App.Format.signedAmount(params.value)}
                </Typography>),
            align: 'right',
        },
        // {
        //     field: 'vat', headerName: 'VAT', align: 'right',
        //     renderCell: (params) => App.Format.signedAmount(params.row.amount > 0 ? params.row.revenues.reduce((a: number, b) => a + +b.invoice.totalVAT, 0) : -params.row.purchases.reduce((a: number, b) => a + +b.vat, 0)),
        // },
        {
            field: 'associations', headerName: 'Associations', flex: 1, valueGetter: (params) => BankTransaction.isCredit(params.row)
                ? params.row.revenues.map(r => r.invoice.number).join(', ')
                : params.row.purchases.map(p => p.attachment.filename).join(', ')
        },
        {
            type: 'actions', field: 'actions', width: 50,
            getActions: (params) => {
                return [
                    <GridActionsCellItem icon={
                    <Link 
                    color={BankTransaction.isFullyAssociated(params.row) ? "success" : BankTransaction.hasAssociation(params.row) ? "warning" : "inherit"} />} 
                    disabled={params.row.state == InvoiceState.DRAFT} 
                    label="Associations" 
                    onClick={() => router.push(`/admin/banktransactions/${params.row.id}`)} />,
                ]
            }
        }
    ];


    return (
        <DataGrid
            density="compact"
            rows={data}
            columns={columns}
            disableColumnFilter
            disableColumnMenu

            hideFooter

            rowSelection
            disableRowSelectionOnClick
            disableDensitySelector
            disableVirtualization
            sortingMode="client"
            initialState={{ sorting: { sortModel: [{ field: 'settledDate', sort: 'desc' }] } }}


            disableColumnSelector
        />
    );
}
