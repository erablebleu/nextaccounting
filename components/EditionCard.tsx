import { Check, Close, Save } from "@mui/icons-material";
import { Box, Button, ButtonGroup, Card, CardHeader } from "@mui/material";
import React from "react";
import DynamicForm from "./DynamicForm";
import { FieldOptions } from "./DynamicField";

export type EditableCardPropsType = {
    children?: any,
    data: any,
    fields: Array<FieldOptions>,
    headerProps?: any,

    onCancel?: () => Promise<void>,
    onSave?: (state: any) => Promise<void>,
    disabled?: boolean
}

export default function({ children, fields, data, headerProps, onCancel, onSave, disabled }: EditableCardPropsType) {
    const [state, setState] = React.useState(data)
    const hasError = fields.some((field: FieldOptions) => field.hasError?.(state[field.propertyName]) ?? false)
    const isDirty = fields.some((field: FieldOptions) => state[field.propertyName] != data[field.propertyName])

    const handleValueChange = (field: FieldOptions, value: any) => {
        setState?.(prev => ({
            ...prev,
            [field.propertyName]: value,
        }))
    }

    return (
        <Card>
            <CardHeader
                {...headerProps}
                action={ !disabled && 
                    <React.Fragment>
                        <ButtonGroup>
                            {onCancel &&
                                <Button onClick={onCancel}>
                                    <Close />
                                </Button>
                            }
                            {onSave &&
                                <Button onClick={() => onSave(state)} disabled={hasError || (!isDirty && state.id != undefined)} color="success">
                                    <Check/>
                                </Button>
                            }
                        </ButtonGroup>
                    </React.Fragment>
                }
            />
            <Box padding={1}>
                <DynamicForm
                    disabled={disabled}
                    fields={fields} 
                    data={state}
                    onValueChange={handleValueChange} />
                {children}
            </Box>
        </Card >
    )
}