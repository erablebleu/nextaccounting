import React from "react";
import useSWR from "swr";
import { Contact, Customer, UserRole } from "@prisma/client";
import { Button, Grid, Stack } from "@mui/material";
import { Add } from "@mui/icons-material";
import { getFetcher } from "../../../tools/fetcher";
import { App } from "../../../context/AppContext";
import { FieldOptions } from "../../../components/DynamicField";
import EditableCard from "../../../components/EditableCard";
import Spinner from "../../../components/Spinner";
import { prisma } from "../../../tools/db";

export default function Contacts({ customers }) {
    const { data, error, mutate } = useSWR('/api/contacts', getFetcher, {})
    const { api } = App.useApp()
    const [newItem, setNewItem] = React.useState<any | undefined>(undefined)

    const editionFields: FieldOptions[] = [{
        type: 'text',
        propertyName: 'name',
        label: 'Name',
        hasError: (value: string) => value.length <= 2,
        keyFilter: (value: string) => /[a-zA-Z0-9 ]/i.test(value),
        errorMessage: 'Name length should be > 2',
        containerProps: { xs: 12 },
        controlProps: { required: true },
    }, {
        type: 'text',
        propertyName: 'position',
        label: 'Position',
        containerProps: { xs: 6, md: 6 },
    }, {
        type: 'select',
        propertyName: 'customerId',
        label: 'Customer',
        containerProps: { xs: 6, md: 6 },
        selectOptions: customers.map((customer: Customer) => ({ label: customer.name, value: customer.id }))
    }, {
        type: 'text',
        propertyName: 'email',
        label: 'Email',
        containerProps: { xs: 6, md: 6 },
        controlProps: { required: true },
    }, {
        type: 'text',
        propertyName: 'phoneNumber',
        label: 'Phone',
        containerProps: { xs: 6, md: 6 },
    }, {
        type: 'text',
        propertyName: 'connectionEmails',
        label: 'Connection emails',
        containerProps: { xs: 12 },
        format: (e: Array<string>) => e.join(' '),
        validate: (e: string) => e.split(' ')
    }, {
        type: 'checkbox',
        propertyName: 'sendInvoice',
        label: 'Send Quoations',
        containerProps: { xs: 6, md: 4 },
    }, {
        type: 'checkbox',
        propertyName: 'sendQuotation',
        label: 'Send Invoices',
        containerProps: { xs: 6, md: 4 },
    },
    ]

    App.useHeader('Contacts')
    App.useActions((
        <React.Fragment>
            <Button onClick={() => {
                const item = {
                    name: 'New contact',
                    email: 'name@domain.com',
                    position: '',
                    phoneNumber: '',
                    sendInvoice: false,
                    sendQuotation: false,
                    customerId: customers[0].id,
                    connectionEmails: new Array<string>(),
                } as Contact
                setNewItem(item)
            }}>
                <Add />
            </Button>
        </React.Fragment>
    ), [data])

    const getItemControl = (item: Contact, onEndEdition?: any) => (
        <EditableCard
            key={crypto.randomUUID()}
            apiService={api.contact}
            headerProps={{ title: item.name, subheader: item.email }}
            editingHeaderProps={{ title: item.name }}
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
                {data.map((contact: Contact) => getItemControl(contact))}
            </Stack>
        </React.Fragment>
    );
}

export async function getServerSideProps() {
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' }})

    return App.validateJSON({ props: { customers } })
}