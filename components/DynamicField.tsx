import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Checkbox, FormControl, FormControlLabel, Grid, IconButton, InputAdornment, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, TextField } from "@mui/material";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { MuiFileInput } from "mui-file-input";
import React from "react";

type SelectOption = {
    label: string
    value: any
}

export class FieldOptions {
    propertyName: string
    label: string
    xs?: number | undefined
    md?: number | undefined
    containerProps?: any = {}
    controlProps?: any = {}
    inputProps?: any = {}
    type: 'text' | 'password' | 'date' | 'datetime' | 'checkbox' | 'select' | 'file' = 'text'
    hasError?: (value: any) => boolean
    errorMessage?: string | undefined
    error?: boolean = false
    keyFilter?: (value: string) => boolean
    validate?: (value: any) => any
    format?: (value: any) => any
    selectOptions?: SelectOption[] = []
}

export default function DynamicField({ field, data, onValueChange, disabled }) {
    const [showPassword, setShowPassword] = React.useState(false);

    const error = field.hasError?.(data[field.propertyName])
    
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleValueChange = (field: FieldOptions, value: any) => {
        onValueChange?.(field, field.validate?.(value) ?? value)
    }

    switch (field.type) {
        case 'text': return (
            <TextField
                disabled={disabled}
                {...field.controlProps}
                fullWidth
                label={field.label}
                value={(field?.format ? field.format(data[field.propertyName]) : data[field.propertyName]) ?? ''}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleValueChange(field, event.target.value)}
                onKeyDown={(event) => (field.keyFilter?.(event.key) ?? true) || event.preventDefault()}
                error={error}
                InputProps={field.inputProps}
                helperText={error ? field.errorMessage : undefined}
            />
        )

        case 'password': return (
            <FormControl 
                disabled={disabled}
                fullWidth
                {...field.controlProps}>
                <InputLabel htmlFor="outlined-adornment-password">{field.label}</InputLabel>
                <OutlinedInput
                    type={showPassword ? 'text' : 'password'}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    }
                    label={field.label}
                    value={data[field.propertyName] ?? ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleValueChange(field, event.target.value)}
                    error={error}
                    inputProps={field.inputProps}
                />
            </FormControl>
        )

        case 'date': return (
            <DatePicker
                disabled={disabled}
                {...field.controlProps}
                fullWidth
                label={field.label}
                value={dayjs(data[field.propertyName])}
                onChange={(value: any, context) => handleValueChange(field, value.toDate())}
                error={error}
                helperText={error ? field.errorMessage : undefined}
                slotProps={{ textField: { fullWidth: true } }}
            />
        )

        case 'datetime': return (
            <DateTimePicker
                disabled={disabled}
                {...field.controlProps}
                fullWidth
                label={field.label}
                value={dayjs(data[field.propertyName])}
                onChange={(value: any, context) => handleValueChange(field, value.toDate())}
                error={error}
                helperText={error ? field.errorMessage : undefined}
                slotProps={{ textField: { fullWidth: true } }}
            />
        )

        case 'checkbox': return (
            <FormControlLabel
                disabled={disabled}
                control={<Checkbox />}
                {...field.controlProps}
                label={field.label}
                checked={data[field.propertyName]}
                onChange={(event: any, checked: boolean) => handleValueChange(field, checked)}
            />
        )

        case 'select': return (
            <FormControl 
                disabled={disabled}
                fullWidth
                {...field.controlProps}>
                <InputLabel>{field.label}</InputLabel>
                <Select
                    value={data[field.propertyName]}
                    label={field.label}
                    onChange={(event: SelectChangeEvent) => handleValueChange(field, event.target.value)}
                >
                    {field.selectOptions?.map((option: SelectOption) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </Select>
            </FormControl>
        )

        case 'file': return (
            <MuiFileInput
                disabled={disabled}
                {...field.controlProps}
                label={field.label}
                fullWidth                
                value={data[field.propertyName]}
                onChange={(value: File | null) => handleValueChange(field, value) } 
                error={error}
                helperText={error ? field.errorMessage : undefined}/>
        )

        default: return 'DataField unknown type'
    }
}
