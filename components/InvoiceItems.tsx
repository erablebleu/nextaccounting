import { Box, Button, ButtonGroup, Divider, Grid, InputAdornment, Typography } from "@mui/material"
import { InvoiceItemUnit, InvoiceItemUnitLabel } from "../tools/enums"
import { FieldOptions } from "./DynamicField"
import { App } from "../context/AppContext"
import useSWR from "swr"
import React from "react"
import { getFetcher } from "../tools/fetcher"
import Spinner from "./Spinner"
import { Add } from "@mui/icons-material"
import EditableCard from "./EditableCard"
import { InvoiceItem } from "../prisma/extensions"
import { useLocalStorage } from "../hooks/useLocalStorage"

const itemsFields: FieldOptions[] = [{
    type: 'text',
    propertyName: 'title',
    label: 'Title',
    containerProps: { xs: 12, md: 12 },
}, {
    type: 'text',
    propertyName: 'description',
    label: 'Description',
    containerProps: { xs: 12, md: 12 },
    controlProps: { multiline: true },
}, {
    type: 'text',
    propertyName: 'quantity',
    label: 'Quantity',
    containerProps: { xs: 6, md: 3 },
}, {
    type: 'select',
    propertyName: 'unit',
    label: 'Unit',
    containerProps: { xs: 6, md: 3 },
    selectOptions: [
        InvoiceItemUnit.DAY,
        InvoiceItemUnit.HOUR,
        InvoiceItemUnit.UNIT,
        InvoiceItemUnit.CLICK,
        InvoiceItemUnit.PAGE,
        InvoiceItemUnit.LINE,
        InvoiceItemUnit.WORD,
        InvoiceItemUnit.CHARACTER,
    ].map((unit: InvoiceItemUnit) => ({
        value: unit, label: InvoiceItemUnitLabel.get(unit) as string
    })),
}, {
    type: 'text',
    propertyName: 'price',
    label: 'Price',
    containerProps: { xs: 6, md: 3 },
    inputProps: { endAdornment: <InputAdornment position="end">€</InputAdornment>, },
}, {
    type: 'text',
    propertyName: 'vatRate',
    label: 'VAT',
    containerProps: { xs: 6, md: 3 },
    inputProps: { endAdornment: <InputAdornment position="end">%</InputAdornment>, },
}, {
    type: 'text',
    propertyName: 'index',
    label: 'index',
    containerProps: { xs: 6, md: 3 },
    validate: value => Number(value)
}]

export default function ({ onChange, url, defaultProperties, disabled }) {
    const { api } = App.useApp()
    const { data, error, mutate } = useSWR(url, getFetcher, {})
    const [newItem, setNewItem] = React.useState<any | undefined>(undefined)
    const [defaultItem, setDefaultItem] = useLocalStorage('invoice.defaultitem', {
        price: 500,
        quantity: 5,
        unit: InvoiceItemUnit.DAY,
        vatRate: 0.2,
    })

    if (error) return null
    if (!data) return <Spinner />

    const handleAdd = async () => {
        setNewItem({
            ...defaultProperties,
            ...defaultItem,
            title: 'New Item',
            description: '',
            index: Math.max(0, ...data.map(item => item.index)) + 1,
        })
    }

    function handleEndEdition(saved: boolean, item: any) {
        if (!item.id)
            setNewItem(undefined)

        if (saved && item) {
            setDefaultItem({
                ...defaultItem,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit,
                vatRate: item.vatRate
            })
        }
    }

    const getItemControl = (invoiceItem: any) => (
        <EditableCard
            disableEdition={disabled}
            key={crypto.randomUUID()}
            apiService={api.invoiceItem}
            headerProps={{
                title: invoiceItem.title,
                subheader: <React.Fragment>
                    {invoiceItem.description && <React.Fragment>
                        {invoiceItem.description}
                        <br />
                    </React.Fragment>}
                    {invoiceItem.quantity} {InvoiceItemUnitLabel.get(invoiceItem.unit)} {App.Format.amount(invoiceItem.price)}
                    <br />
                    {App.Format.amount(InvoiceItem.getTotal(invoiceItem))}
                </React.Fragment>
            }}
            editingHeaderProps={{ title: invoiceItem.title }}
            data={invoiceItem}
            fields={itemsFields}
            onChange={() => {
                mutate()
                onChange()
            }}
            onEndEdition={handleEndEdition}
        />)

    return (
        <React.Fragment>
            {
                (!disabled || data.length > 0) &&
                <React.Fragment>
                    <Divider />
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                        <Typography sx={{ flexGrow: 1 }} variant="h5" >ITEMS</Typography>
                        <Grid item sx={{ align: 'right' }}>
                            {!disabled &&
                                <ButtonGroup>
                                    <Button onClick={handleAdd}>
                                        <Add />
                                    </Button>
                                </ButtonGroup>
                            }
                        </Grid>
                    </Box>
                    {newItem && getItemControl(newItem)}
                    {data.map((item) => getItemControl(item))}
                </React.Fragment>
            }
        </React.Fragment>
    )
}