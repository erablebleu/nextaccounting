import { useSnackbar } from 'notistack'
import React, { DependencyList } from 'react'
import { api } from '../services/api.service'
import { DialogBoxContext } from './DialogBoxContext'
import { ErrorHandlerContext } from './ErrorHandlerContext'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { Prisma, UserRole } from '@prisma/client'
import { AccountBalance, Business, Euro, ImportExport, InsertDriveFile, MoneyOff, PermContactCalendar, Shop, Task } from '@mui/icons-material'

export type AppContextType = {
    header: string
    setHeader: React.Dispatch<React.SetStateAction<string>>
    year: number
    setYear: React.Dispatch<React.SetStateAction<number>>
    formActions: React.ReactElement | undefined
    setFormActions: React.Dispatch<React.SetStateAction<React.ReactElement | undefined>>
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined)

export class FormAction {
    caption: string
    callback: () => void
    isEnabled?: () => boolean | undefined
    content: React.ReactElement
}

export namespace App {

    export const useApp = () => {
        const appContext = React.useContext(AppContext)
        const dialogBoxContext = React.useContext(DialogBoxContext)
        const errorHandlerContext = React.useContext(ErrorHandlerContext)
        const { data: session } = useSession()
        const { enqueueSnackbar } = useSnackbar()

        if (!appContext) {
            throw new Error('No AppContext provider found when calling useApp!');
        }

        const copyShareLink = async (id: string | undefined) => {
            fetch(`/api/share/link/${id}`)
                .then((res: Response) => res.json())
                .then((res: any) => {
                    copyToClipboard(`${window.location.origin}/share/documents/${res.encoded}`)
                })
                .catch(errorHandlerContext.defaultErrorHandler)
        }

        const copyToClipboard = async (value: string | undefined) => {
            if(!value) {
                return
            }

            navigator.clipboard.writeText(value)
                .then(() => enqueueSnackbar(`Link successfully copied to clipboard !`, { variant: 'success' }))
        }

        return {
            ...appContext,
            ...dialogBoxContext,
            ...errorHandlerContext,
            session,
            api,
            role: session ? session.role as UserRole : undefined,
            enqueueSnackbar,
            copyShareLink,
            copyToClipboard,
        }
    }

    // export function useCookie<T>(name: string, defaultValue: T): [T, (value: T) => void] {
    //     const [cookies, setCookie, removeCookie] = useCookies([name]);

    //     if(canUseDOM){

    //     }
    //     console.log(`cookies[${name}]=${cookies[name]}`)
    //     const cookie = cookies[name]
    //     return [cookie , (value: T) => setCookie(name, JSON.stringify(value))]


    //     const [state, setState] = useState<T>(defaultValue)

    //     useFirstRender(() => {
    //         const cookie = cookies[name]
    //         if (cookie) {
    //             setState(JSON.parse(cookie))
    //         }
    //     })

    //     return [state, (value: T) => {
    //         setState(value)
    //         setCookie(name, JSON.stringify(value))
    //     }]
    // }

    export const useHeader = (header: string, deps?: DependencyList) => {
        const { setHeader } = useApp()

        React.useEffect(() => {
            setHeader(header)
            return () => setHeader('')
        }, deps);
    }

    export const useActions = (actions: React.ReactElement | undefined, deps?: DependencyList) => {
        const { setFormActions } = useApp()

        React.useEffect(() => {
            setFormActions(actions)
            return () => setFormActions(undefined)
        }, deps);
    }

    export namespace Format {
        const amountFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

        export const size = (value: any) => {
            const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
            let l = 0, n = parseInt(value, 10) || 0;

            while (n >= 1024 && ++l) {
                n = n / 1024;
            }

            return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l])
        }
        export const date = (value: any) => dayjs(value).format('DD/MM/YYYY')
        export const datetime = (value: any) => dayjs(value).format('HH:mm:ss DD/MM/YYYY')
        export const amount = (value: number | Prisma.Decimal | undefined): string => {

            if (!value) {
                return ''
            }
            if (value instanceof Prisma.Decimal) {
                value = value.toNumber()
            }
            else if (typeof value === 'string') {
                value = Number(value)
            }
            if (typeof value === 'number') {
                return Number.isNaN(value) ? '' : amountFormat.format(value)
            }

            throw new Error('unsupported type')

        }
        export const signedAmount = (value: number) => !value || Number.isNaN(value) ? '' : (value > 0 ? '+' : '') + amountFormat.format(value)
        export const percentage = (value: any) => `${Number(value).toString()} %`
    }

    export namespace Icons {
        export const Invoice = <Task />
        export const Quotation = <InsertDriveFile />
        export const Purchase = <Shop />
        export const Revenue = <Euro />
        export const BankAccount = <AccountBalance />
        export const BankTransaction = <ImportExport />
        export const Tax = <MoneyOff />
        export const Contact = <PermContactCalendar />
        export const Customer = <Business />
        export const File = <InsertDriveFile />
    }

    export namespace DataGrid {
        export namespace Renderers {
            export const signedAmount = (params) => App.Format.signedAmount(params.value)
            export const amount = (params) => App.Format.amount(params.value)
            export const date = (params) => App.Format.date(params.value)
            export const datetime = (params) => App.Format.datetime(params.value)
            export const size = (params) => App.Format.size(params.value)
        }
    }

    export const validateJSON = (value: any) => JSON.parse(JSON.stringify(value))

    export async function download(url: string, errorHandler?) {
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/pdf',
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    const error = new Error((await res.json()).error)
                    throw error
                }

                const filename = res.headers.get('content-disposition')?.split('=')[1] ?? 'attachment.pdf'
                const blob = await res.blob()

                const url = window.URL.createObjectURL(new Blob([blob]))
                clickA(url, [{ name: 'download', value: filename }])
            })
            .catch(errorHandler)
    }

    export async function sendMail(mail: string, subject?: string, body?: string) {
        return await clickA(`mailto:${mail}?subject=${encodeURIComponent(subject ?? '')}&body=${encodeURIComponent(body ?? '')}`)
    }

    export async function clickA(url: string, attributes: Array<{ name: string, value }> = []) {
        const link = document.createElement('a')
        link.href = url

        for (const attribute of attributes) {
            link.setAttribute(attribute.name, attribute.value)
        }

        document.body.appendChild(link);
        link.click();
        link.parentNode!.removeChild(link);
    }
}