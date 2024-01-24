import { Grid } from "@mui/material"
import DynamicField, { FieldOptions } from "./DynamicField"

export default function DynamicForm({ fields, data, onValueChange, disabled }) {

    return (
        <Grid container spacing={2}>
            {fields.map((field: FieldOptions) => (
                <Grid item {...field.containerProps} key={field.propertyName} >
                    <DynamicField
                        disabled={disabled}
                        field={field} 
                        data={data} 
                        onValueChange={onValueChange}
                        />
                </Grid>))}
        </Grid>
    )
}