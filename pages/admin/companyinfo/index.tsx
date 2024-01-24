import React from "react";
import { prisma } from "../../../tools/db";
import { App } from "../../../context/AppContext";
import { FieldOptions } from "../../../components/DynamicField";
import EditionCard from "../../../components/EditionCard";
import { Box } from "@mui/material";

const fields: FieldOptions[] = [{
    type: 'text',
    propertyName: 'name',
    label: 'Name',
    containerProps: { xs: 12, md: 8 },
}, {
    type: 'date',
    propertyName: 'creationDate',
    label: 'Creation Date',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'mail',
    label: 'Mail',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'phoneNumber',
    label: 'Phone Number',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'website',
    label: 'Website',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'address',
    label: 'Address',
    containerProps: { xs: 12, md: 12 },
    controlProps: { multiline: true },
}, {
    type: 'text',
    propertyName: 'siren',
    label: 'SIREN',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'siret',
    label: 'SIRET',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'vat',
    label: 'VAT',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'apeCode',
    label: 'APE CODE',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'activity',
    label: 'Activity',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'legalStatus',
    label: 'Legal Status',
    containerProps: { xs: 12, md: 4 },
}, {
    type: 'text',
    propertyName: 'quotationNumberingFormat',
    label: 'Quotation Numbering Format',
    containerProps: { xs: 12, md: 6 },
}, {
    type: 'text',
    propertyName: 'quotationIndex',
    label: 'Quotation Index',
    containerProps: { xs: 12, md: 6 },
}, {
    type: 'text',
    propertyName: 'quotationCustomHeader',
    label: 'Quotation Custom Header',
    containerProps: { xs: 12, md: 12 },
    controlProps: { multiline: true },
}, {
    type: 'text',
    propertyName: 'quotationCustomFooter',
    label: 'Quotation Custom Footer',
    containerProps: { xs: 12, md: 12 },
    controlProps: { multiline: true },
}, {
    type: 'text',
    propertyName: 'invoiceNumberingFormat',
    label: 'Invoice Numbering Format',
    containerProps: { xs: 12, md: 6 },
}, {
    type: 'text',
    propertyName: 'invoiceIndex',
    label: 'Invoice Index',
    containerProps: { xs: 12, md: 6 },
}, {
    type: 'text',
    propertyName: 'invoiceCustomHeader',
    label: 'Invoice Custom Header',
    containerProps: { xs: 12, md: 12 },
    controlProps: { multiline: true },
}, {
    type: 'text',
    propertyName: 'invoiceCustomFooter',
    label: 'Invoice Custom Footer',
    containerProps: { xs: 12, md: 12 },
    controlProps: { multiline: true },
},
]

export default function ({ companyInfo }) {
    const [state, setState] = React.useState(companyInfo)
    const { enqueueSnackbar, defaultErrorHandler, api } = App.useApp()

    const handleSave = async (state: any) => {
        await api.companyInfo.update(state.id, state)
        .then((res: Response) => {
            enqueueSnackbar(`Item successfully updated !`, { variant: 'success' })
            setState(state)
        })
        .catch(defaultErrorHandler)
    }

    return (<React.Fragment>
        <Box margin={1}>
            <EditionCard
                headerProps={{
                    title: `Company Info`,
                }}
                data={state}
                fields={fields}
                onSave={handleSave}
            />
        </Box>
    </React.Fragment>)
}

export async function getServerSideProps() {
    return App.validateJSON({
        props: {
            companyInfo: await prisma.companyInfo.findFirst(),
        }
    })
}