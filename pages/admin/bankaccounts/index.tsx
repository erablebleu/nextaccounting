import React from "react";
import useSWR from "swr";
import { BankAccount, UserRole } from "@prisma/client";
import Spinner from "../../../components/Spinner";
import { Box, Button, ButtonGroup, Card, CardHeader, Divider, Grid, IconButton, Link, ListItemIcon, Menu, MenuItem, Stack } from "@mui/material";
import { App } from "../../../context/AppContext";
import { Add, Cancel, Check, Delete, Edit, MoreVert } from "@mui/icons-material";
import { FieldOptions } from "../../../components/DynamicField";
import EditableCard from "../../../components/EditableCard";
import { handleError } from "../../../tools/fetcher";

const editionFields: FieldOptions[] = [{
    type: 'text',
    propertyName: 'label',
    label: 'Label',
    hasError: (value: string) => value.length <= 2,
    errorMessage: 'Label length should be > 2',
    containerProps: { xs: 12, md: 8 },
    controlProps: { required: true },
}, {
    type: 'text',
    propertyName: 'bank',
    label: 'Bank',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'iban',
    label: 'Iban',
    hasError: (value: string) => !/^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){5}[ ]?[0-9]{3}$/gm.test(value),
    inputProps: { style: { textTransform: "uppercase" }, maxLength: 24 },
    keyFilter: (value: string) => /[a-zA-Z0-9 ]/i.test(value),
    containerProps: { xs: 12, md: 8 },
    controlProps: { required: true },
}, {
    type: 'text',
    propertyName: 'bic',
    label: 'Bic',
    hasError: (value: string) => !/^[A-Z0-9]{11}$/gm.test(value),
    inputProps: { style: { textTransform: "uppercase" }, maxLength: 11 },
    keyFilter: (value: string) => /[a-zA-Z0-9]/i.test(value),
    containerProps: { xs: 12, md: 4 },
    controlProps: { required: true },
}, {
    type: 'text',
    propertyName: 'rib',
    label: 'Rib',
    hasError: (value: string) => !/^([0-9]{5}[ ]?){2}[0-9]{10}[ ]?[0-9]{3}$/gm.test(value),
    inputProps: { style: { textTransform: "uppercase" }, maxLength: 26 },
    keyFilter: (value: string) => /[a-zA-Z0-9 ]/i.test(value),
    containerProps: { xs: 12 },
    controlProps: { required: true },
}, {
    type: 'password',
    propertyName: 'apiInfo',
    label: 'Api Info',
    containerProps: { xs: 12, md: 12 },
    controlProps: { required: true },
}, {
    type: 'date',
    propertyName: 'openDate',
    label: 'Open date',
    containerProps: { xs: 12, md: 12 },
    controlProps: { required: true },
},
]

const fetcher = async (url: URL) => handleError(await fetch(url, { method: 'GET' })).json()

export default function BankAccounts() {
    const { api } = App.useApp()
    const { data, error, mutate } = useSWR('/api/bankaccounts', fetcher, {})
    const [newItem, setNewItem] = React.useState<any | undefined>(undefined)

    App.useHeader('Bank Accounts')
    App.useActions((
        <React.Fragment>
            <Button onClick={() => {
                const item = {
                    label: 'New Account',
                    bank: 'BANK',
                    bic: '',
                    rib: '',
                    iban: '',
                    apiInfo: '',
                    openDate: new Date(),
                }
                setNewItem(item)
            }}>
                <Add />
            </Button>
        </React.Fragment>
    ), [data])

    const getItemControl = (item: BankAccount, onEndEdition?: any) => (
        <EditableCard
            key={crypto.randomUUID()}
            apiService={api.bankAccount}
            headerProps={{ title: item.label, subheader: item.bank }}
            editingHeaderProps={{ title: item.label }}
            data={item}
            fields={editionFields}
            onChange={() => mutate()}
            onEndEdition={onEndEdition}
        />)

    if (error) return null
    if (!data) return <Spinner />

    return (
        <React.Fragment>
            <Stack spacing={1} margin={1}>
                {newItem && getItemControl(newItem, () => setNewItem(undefined))}
                {data.map((contact: BankAccount) => getItemControl(contact))}
            </Stack>
        </React.Fragment>
    );
}