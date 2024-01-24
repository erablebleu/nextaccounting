import React from "react";
import { useSnackbar } from "notistack";

export type ErrorHandlerType = {
    defaultErrorHandler: (error: Error) => void
}

export const ErrorHandlerContext = React.createContext<ErrorHandlerType>({
    defaultErrorHandler: async (error: Error) => { }
})

export default function ErrorHandlerProvider({ children }) {
    const { enqueueSnackbar } = useSnackbar()

    const defaultErrorHandler = (error: Error) => {
        enqueueSnackbar(
            <span>
                Error: {error.message}
            </span>, { variant: 'error' })
    }

    return (
        <ErrorHandlerContext.Provider value={{ defaultErrorHandler }}>
            {children}
        </ErrorHandlerContext.Provider>
    )
}