import React from "react";
import useSWR from "swr";
import { getFetcher } from "../../../tools/fetcher";
import { App } from "../../../context/AppContext";
import { Add } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import Spinner from "../../../components/Spinner";
import { FieldOptions } from "../../../components/DynamicField";
import EditableCard from "../../../components/EditableCard";

const editionFields: FieldOptions[] = [{
    type: 'text',
    propertyName: 'name',
    label: 'Name',
    hasError: (value: string) => value.length <= 2,
    errorMessage: 'Name length should be > 2',
    containerProps: { xs: 12 },
    controlProps: { required: true },
}, {
    type: 'text',
    propertyName: 'rate',
    label: 'Rate',
    containerProps: { xs: 12 },
    controlProps: { required: true },
},
]

export default function () {
    const { api } = App.useApp()
    const { data, error, mutate } = useSWR(`/api/taxes`, getFetcher, {})
    const [newItem, setNewItem] = React.useState<any | undefined>(undefined)

    App.useHeader('Taxes')
    App.useActions((
        <React.Fragment>
            <Button onClick={() => {
                const item = {
                    name: 'New tax',
                    rate: 0.5,
                }
                setNewItem(item)
            }}>
                <Add />
            </Button>
        </React.Fragment>
    ), [data])

    const getItemControl = (item: any, onEndEdition?: any) => (
        <EditableCard
            key={crypto.randomUUID()}
            apiService={api.tax}
            headerProps={{ title: item.name, subheader: App.Format.percentage(item.rate) }}
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
                {data.map((item: any) => getItemControl(item))}
            </Stack>
        </React.Fragment>
    )
}