import React from "react";
import { FieldOptions } from "../components/DynamicField";

export type EditionContextType = {
    state: any,
    setState: React.Dispatch<any>,
    isDirty: boolean,
    hasError: boolean,
    canCancel: boolean,
    canSave: boolean,
    handleValueChange: (field: FieldOptions, value: any) => void    
}

export const EditionContext = React.createContext<EditionContextType>({
    state: {},
    setState: (value: any) => {},
    isDirty: false,
    hasError: false,
    canCancel: true,
    canSave: false,
    handleValueChange: (field: FieldOptions, value: any) => {},
})