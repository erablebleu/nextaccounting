import React from "react";
import useSWR from "swr";
import { Customer, UserRole } from "@prisma/client";
import { Box, Button, Grid, List, Stack } from "@mui/material";
import { Add } from "@mui/icons-material";
import { FieldOptions } from "../../../components/DynamicField";
import { App } from "../../../context/AppContext";
import { getFetcher } from "../../../tools/fetcher";
import Spinner from "../../../components/Spinner";
import EditableCard from "../../../components/EditableCard";


export default function Customers() {
    const { data, error, mutate } = useSWR('/api/customers', getFetcher, {})
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
        propertyName: 'siret',
        label: 'SIRET',
        hasError: (value: string) => !/^[0-9]{14}$/.test(value),
        keyFilter: (value: string) => /[0-9]/i.test(value),
        inputProps: { maxLength: 14},
        errorMessage: 'SIRET format is NNNNNNNNNNNNNN',
        containerProps: { xs: 6, md: 4 },
        controlProps: { required: true },
    }, {
        type: 'text',
        propertyName: 'siren',
        label: 'SIREN',
        hasError: (value: string) => !/^[0-9]{9}$/.test(value),
        keyFilter: (value: string) => /[0-9]/i.test(value),
        inputProps: { maxLength: 9},
        errorMessage: 'SIREN format is NNNNNNNNN',
        containerProps: { xs: 6, md: 4 },
        controlProps: { required: true },
    }, {
        type: 'text',
        propertyName: 'vat',
        label: 'VAT number',
        hasError: (value: string) => !/^[a-zA-Z]{2}[0-9]{2,13}$/.test(value),
        keyFilter: (value: string) => /[a-zA-Z0-9]/i.test(value),
        inputProps: { style: { textTransform: "uppercase" }, maxLength: 15},
        errorMessage: 'VAT number format is XXNNNNNNNNNNN',
        containerProps: { xs: 6, md: 4 },
        controlProps: { required: true },
    }, {
        type: 'text',
        propertyName: 'address',
        label: 'Address',
        containerProps: { xs: 12 },
        controlProps: { multiline: true },
    }, {
        type: 'text',
        propertyName: 'website',
        label: 'Website',
        containerProps: { xs: 12 },
    }, {
        type: 'text',
        propertyName: 'dataPath',
        label: 'Data Path',
        containerProps: { xs: 6 },
    }, {
        type: 'text',
        propertyName: 'color',
        label: 'Color',
        containerProps: { xs: 6 },
    },
    ]

    App.useHeader('Customers')
    App.useActions((
        <React.Fragment>
            <Button onClick={() => {
                const item = {
                    name: 'New Customer',
                } as Customer
                setNewItem(item)
            }}>
                <Add />
            </Button>
        </React.Fragment>
    ), [data])

    const getItemControl = (item: Customer, onEndEdition?: any) => (
        <EditableCard
            key={crypto.randomUUID()}
            apiService={api.customer}
            headerProps={{ title: item.name, subheader: item.siret }}
            editingHeaderProps={{ title: item.name }}
            data={item}
            fields={editionFields}
            onChange={() => mutate()}
            onEndEdition={onEndEdition}
        />)

        
    // const { confirmNavigation } = useNavigationObserver({
    //     shouldStopNavigation: isDirty,
    //     onNavigate: () => {
    //         showDialog({
    //             title: 'Unsaved changes',
    //             message: `There is unsaved changes, do you want to continue ?`,
    //             actions: [{ caption: 'save' }, { caption: 'discard' }, { caption: 'cancel' }]
    //         }).then(action => {
    //             switch (action.caption) {
    //                 case 'save':
    //                     save();
    //                     confirmNavigation()
    //                     break;

    //                 case 'discard':
    //                     confirmNavigation()
    //                     break;
    //             }
    //         })
    //     },
    // })

    if (error) return null
    if (!data) return <Spinner />

    return (
        <React.Fragment>
            <Stack spacing={1} margin={1}>
                {newItem && getItemControl(newItem, () => setNewItem(undefined))}
                {data.map((contact: Customer) => getItemControl(contact))}
            </Stack>
        </React.Fragment>
    );
}