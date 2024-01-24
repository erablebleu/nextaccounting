import React from "react";
import TextDialog from "../components/TextDialog";
import PDFDialog from "../components/PDFDialog";

type TextDialogOptions = {
    title?: string
    message?: string
    actions?: AlertAction[]
    allowDismiss?: boolean
}

type PDFDialogOptions = {
    title?: string
    url: string
    actions?: AlertAction[]
    allowDismiss?: boolean
}

export type DialogBoxType = {
    showDialog: (options: TextDialogOptions) => Promise<AlertAction | undefined>
    showPDFDialog: (options: PDFDialogOptions) => Promise<AlertAction | undefined>
}

export const DialogBoxContext = React.createContext<DialogBoxType>({
    showDialog: async (options: TextDialogOptions): Promise<AlertAction | undefined> => undefined,
    showPDFDialog: async (options: PDFDialogOptions): Promise<AlertAction | undefined> => undefined,
})

export class AlertAction {
    caption: string
}

export class DialogOptions {
    type: 'text' | 'pdf'
    url?: string
    title?: string
    message?: string
    actions?: AlertAction[]
    resolve?: any
    allowDismiss?: boolean
}

export default function DialogBoxProvider({ children }) {
    const queue = React.useRef<Array<DialogOptions>>([])
    const [data, setData] = React.useState<DialogOptions | undefined>(undefined)

    const handleClick = (action?: AlertAction | undefined) => {
        data?.resolve(action)
        queue.current.shift()
        if (queue.current.length > 0) {
            setData(queue.current[0])
        }
        else {
            setData(undefined)
        }
    }

    const show = async (options: DialogOptions): Promise<AlertAction | undefined> => {
        queue.current.push(options)
        if (queue.current.length == 1) {
            setData(options)
        }

        return new Promise<AlertAction | undefined>((resolve) => {
            options.resolve = resolve
        })
    }

    const showDialog = async (options: TextDialogOptions): Promise<AlertAction | undefined> => await show({
        type: 'text',
        ...options
    })

    const showPDFDialog = async (options: PDFDialogOptions) => await show({
        type: 'pdf',
        ...options
    })

    const getDialog = () => {
        if(!data) {
            return undefined
        }

        switch (data.type) {
            case 'text': return <TextDialog options={data} onClick={handleClick} />
            case 'pdf': return <PDFDialog options={data} onClick={handleClick} />
            default: return undefined
        }
    }

    return (<React.Fragment>
        {getDialog()}
        <DialogBoxContext.Provider value={{ showDialog, showPDFDialog }}>
            {children}
        </DialogBoxContext.Provider>
    </React.Fragment>)
}