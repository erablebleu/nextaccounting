import { Box, Card, CardHeader } from "@mui/material"
import { FieldOptions } from "./DynamicField"
import React from "react";
import { Delete, Edit } from "@mui/icons-material";
import { ApiService } from "../services/api.service";
import { App } from "../context/AppContext";
import EditionCard from "./EditionCard";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

type EditableCardPropsType = {
    children?: any,
    data: any,
    fields: Array<FieldOptions>,
    headerProps?: any,
    editingHeaderProps?: any,
    apiService: ApiService,
    onChange?: () => void,
    onStartEdition?: () => void,
    onEndEdition?: (saved: boolean) => void,
    disableEdition?: boolean,
    customFields?: any,
    customMenu?: Array<ContextMenuItem>,
    beforeSave?: (value: any) => Promise<any>,
}

export default function ({ children, data, fields, headerProps, editingHeaderProps, apiService, onChange, onStartEdition, onEndEdition, disableEdition, customFields, customMenu, beforeSave }: EditableCardPropsType) {
    const [edition, setEdition] = React.useState(data.id ? false : true)
    const { showDialog, enqueueSnackbar, defaultErrorHandler } = App.useApp()

    const handleEdit = () => {
        onStartEdition?.()
        setEdition(true)
    }

    const handleDelete = async () => {
        const answer = await showDialog({
            title: 'Item deletion',
            message: `Are you sure you wants to delete item ?`,
            actions: [{ caption: 'confirm' }, { caption: 'cancel' }]
        })

        switch (answer?.caption) {
            case 'confirm':
                await apiService.delete(data.id)
                    .then((res: Response) => {
                        enqueueSnackbar(`Item successfully deleted !`, { variant: 'success' })
                        onChange?.()
                    })
                    .catch(defaultErrorHandler)
                break;
        }
    }

    async function handleSave(state: any) {
        if (beforeSave) {
            state = await beforeSave(state)
        }
        if (state.id) {
            await apiService.update(state.id, state)
                .then((res: Response) => {
                    enqueueSnackbar(`Item successfully updated !`, { variant: 'success' })
                    onChange?.()
                    onEndEdition?.(true)
                    setEdition(false)
                })
                .catch(defaultErrorHandler)
        }
        else {
            await apiService.create(state)
                .then((res: Response) => {
                    enqueueSnackbar(`Item successfully created !`, { variant: 'success' })
                    onChange?.()
                    onEndEdition?.(true)
                    setEdition(false)
                })
                .catch(defaultErrorHandler)
        }
    }

    const handleCancel = async () => {
        onEndEdition?.(true)
        setEdition(false)
    }

    return (

        <React.Fragment>
            {
                edition ?
                    (<EditionCard
                        fields={fields}
                        data={data}
                        headerProps={editingHeaderProps}
                        onCancel={handleCancel}
                        onSave={handleSave}
                    >
                        {customFields}
                    </EditionCard>
                    )
                    : (
                        <Card>
                            <CardHeader
                                {...headerProps}
                                action={ disableEdition ? [] :
                                    <ContextMenu actions={[
                                        { label: 'Edit', icon: <Edit />, onClick: handleEdit },
                                        ...customMenu ?? [],
                                        { label: 'Delete', icon: <Delete />, onClick: handleDelete },
                                    ]} />
                                }
                            />
                            {
                                children &&
                                <Box padding={2}>
                                    {children}
                                </Box>
                            }
                        </Card>)
            }
        </React.Fragment >
    )
}