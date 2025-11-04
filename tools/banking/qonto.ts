import dayjs from "dayjs";
import { IBankingClient } from "./banking";
import { InvoiceItemUnit } from "../enums";
import { FinalizeInvoiceResult, IInvoiceGenerator } from "../invoice/generator";
import { prisma } from "../db";
import { delay } from "../tools";

const BASE_URI = 'https://thirdparty.qonto.com/v2'
// const BASE_URI = 'https://thirdparty-sandbox.staging.qonto.co/v2' // for sandbox

type DataClient = {
    id: string,
    name: string
}

type DataInvoice = {
    id: string,
    number: string,
    client: DataClient
}

type CreateInvoiceResult = {
    id: string
    organization_id: string
    number: string
    invoice_url: string
}

type InvoiceResult = {
    id: string
    organization_id: string
    attachment_id: string
    number: string
    invoice_url: string
}

async function fetchJson<T>(input: string | URL | globalThis.Request, init?: RequestInit,): Promise<T> {
    const response: Response = await fetch(input, init)
    return await response.json() as T
}

export class QontoClient implements IBankingClient, IInvoiceGenerator {
    constructor(
        private _iban: string,
        private _authorization: string) { }

    private getHeaders(): any {
        return {
            accept: 'application/json, text/plain',
            authorization: this._authorization,
            // 'X-Qonto-Staging-Token': '<token>' // for sandbox
        }
    }

    /**
     * Get Bank transacitions async
     * @param from date
     * @param to date
     * @returns array of transactions
     */
    public async getTransactions(from: Date | null, to: Date): Promise<Array<any>> {
        const result: Array<any> = []
        var uri = `${BASE_URI}/transactions?sort_by=settled_at:asc&iban=${this._iban.replaceAll(' ', '')}`
        var page = 1

        // Format uri
        if (from) {
            uri += `&settled_at_from=${dayjs(from).toISOString()}`
        }
        uri += `&settled_at_to=${dayjs(to).toISOString()}`

        // Page read loop
        var qdata: any = undefined
        do {
            qdata = await fetchJson(uri + `&current_page=${page}`, {
                method: 'GET',
                headers: this.getHeaders()
            })

            result.push(...qdata.transactions.map(transaction => ({
                amount: transaction.side == 'debit' ? -transaction.amount : transaction.amount,
                label: transaction.label,
                reference: transaction.reference,
                settledDate: transaction.settled_at,
                transactionId: transaction.transaction_id,
            })))

            page++

        } while (qdata?.meta?.next_page)

        return result
    }

    /**
     * Get invoice draft number async
     * @returns invoice draft number
     */
    public async getInvoiceDraftNumber(): Promise<string | null> {        
        const companyInfo = await prisma.companyInfo.findFirst()

        if (!companyInfo) {
            throw new Error('Missing company info')
        }
            
        await prisma.companyInfo.updateMany({ data: { invoiceIndex: { increment: 1, } } })

        return `draft_${String(companyInfo.invoiceIndex + 1).padStart(3, '0')}`
    }

    /**
     * Get customerId async
     * @param clientName name of the customer
     * @returns id of the customer
     */
    private async getCustomerId(clientName: string): Promise<string> {
        const clientsResponse = await fetchJson<{clients: Array<DataClient>}>(`${BASE_URI}/clients?filter[name]=${clientName}&page=1&per_page=2`, {
            method: 'GET',
            headers: this.getHeaders()
        })

        const client = clientsResponse.clients?.find(client => client.name && client.name == clientName)

        if (!client) {
            console.error(clientsResponse)
            throw new Error(`[QONTO] Client ${clientName} not found`)
        }

        return client.id
    }

    /**
     * map invoice object (to QONTO) async
     * @param invoice local invoice object
     * @returns qonto invoice object
     */
    private mapInvoice(invoice: any): any {
        return {
            issue_date: dayjs(invoice.issueDate).format('YYYY-MM-DD'),
            due_date: dayjs(invoice.issueDate).add(30, 'day').format('YYYY-MM-DD'),
            currency: 'EUR',
            payment_methods: { iban: this._iban },
            status: 'draft',
            items: invoice.items.map(item => ({
                title: item.title,
                quantity: `${item.quantity}`,
                unit_price: {
                    value: `${item.price}`,
                    currency: 'EUR'
                },
                vat_rate: `${item.vatRate}`,
                description: item.description?.replaceAll('\n', '\r\n'),
                unit: InvoiceItemUnit[item.unit].toLowerCase(),
            })),
            number: invoice.number,
        }
    }

    /**
     * Create QONTO invoice async
     * @param invoice invoice to create
     * @returns id of the created QONTO invoice
     */
    private async createInvoice(invoice: any): Promise<string> {
        // find customer id
        const customerId = await this.getCustomerId(invoice.customer.name)
        
        const body = {
            ...this.mapInvoice(invoice),
            client_id: customerId,
        }

        const createInvoiceResponse = await fetchJson<{client_invoice: CreateInvoiceResult}>(`${BASE_URI}/client_invoices`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        })

        if (!createInvoiceResponse.client_invoice) {
            console.error(createInvoiceResponse)
            throw new Error(`[QONTO] Unable to create invoice ${invoice.number}`)
        }

        return createInvoiceResponse.client_invoice.id
    }

    /**
     * Update QONTO invoice async
     * @param id of the invoice
     * @param customerId of the customer
     * @param invoice to update
     * @returns none
     */
    private async updateInvoice(id: string, customerId: string, invoice: any) {       
        const body = {
            ...this.mapInvoice(invoice),
            client_id: customerId,
        }

        const createInvoiceResponse = await fetchJson<{client_invoice: CreateInvoiceResult}>(`${BASE_URI}/client_invoices/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        })

        if (!createInvoiceResponse.client_invoice) {
            console.error(createInvoiceResponse)
            throw new Error(`[QONTO] Unable to update invoice ${invoice.number}`)
        }

        return createInvoiceResponse.client_invoice.id

    }

    /**
     * Get invoice PDF async
     * @param invoiceId id of the invoice
     * @returns pdf file data and invoice number
     */
    private async getInvoicePDF(invoiceId: string): Promise<{pdfData: Buffer, number: string}> {
        let attachmentId: string | null = null
        let number: string | null = null

        // await async pdf generation
        for(let i = 0; i < 10; i++) {
            await delay(500)

            // Get invoice
            const invoiceResponse = await fetchJson<{client_invoice: InvoiceResult}>(`${BASE_URI}/client_invoices/${invoiceId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            })

            attachmentId = invoiceResponse.client_invoice.attachment_id
            number = invoiceResponse.client_invoice.number
            console.log(`[QONTO] get invoice ${i} : ${attachmentId}`)

            if (attachmentId) {
                break
            }
        }

        if (!attachmentId || !number)
            throw new Error('[QONTO] Unable to retrieve invoice attachment id')

        // Get attachement
        const attachmentResponse = await fetchJson<{attachment: { file_name: string, url: string }}>(`${BASE_URI}/attachments/${attachmentId}`, {
            method: 'GET',
            headers: this.getHeaders(),
        })

        if (!attachmentResponse.attachment) {
            console.error(attachmentResponse)
            throw new Error(`[QONTO] Unable to get attachment`)
        }
        
        // Get file
        const fileResponse = await fetch(attachmentResponse.attachment.url, { method: 'GET' })

        return {
            number, 
            pdfData: Buffer.from(await fileResponse.arrayBuffer())
        }
    }

    /**
     * Get draft invoice preview PDF async
     * @param invoice to preview
     * @returns pdf data
     */
    public async previewInvoice(invoice: any): Promise<Buffer> {        
        // Retrieve invoice
        const invoicesResponse = await fetchJson<{client_invoices: Array<DataInvoice>}>(`${BASE_URI}/client_invoices?filter[status]=draft&filter[number]=${invoice.number}`, {
            method: 'GET',
            headers: this.getHeaders()
        })

        const existingInvoice = invoicesResponse.client_invoices?.find(client_invoice => client_invoice.number && client_invoice.number == invoice.number)
        let invoiceId: string

        if (existingInvoice) { // Update existing invoice
            invoiceId = existingInvoice.id
            await this.updateInvoice(existingInvoice.id, existingInvoice.client.id, invoice)
        }
        else { // Create new draft
            invoiceId = await this.createInvoice(invoice)
        }

        return (await this.getInvoicePDF(invoiceId)).pdfData
    }
    
    /**
     * Finalize an invoice async
     * @param invoice to finalize
     * @returns pdf file data and invoice number
     */
    public async finalizeInvoice(invoice: any): Promise<FinalizeInvoiceResult> {           
        // Retrieve invoice
        const invoicesResponse = await fetchJson<{client_invoices: Array<DataInvoice>}>(`${BASE_URI}/client_invoices?filter[status]=draft&filter[number]=${invoice.number}`, {
            method: 'GET',
            headers: this.getHeaders()
        })

        const existingInvoice = invoicesResponse.client_invoices?.find(client_invoice => client_invoice.number && client_invoice.number == invoice.number)
        let invoiceId: string

        // reset temp number to use Qonto generation
        invoice.number = null
        if (existingInvoice) { // Update existing invoice
            invoiceId = existingInvoice.id
            await this.updateInvoice(existingInvoice.id, existingInvoice.client.id, invoice)
        }
        else { // Create new draft
            invoiceId = await this.createInvoice(invoice)
        }

        // await first pdf generation
        await this.getInvoicePDF(invoiceId)

        // Finalize invoice
        const createInvoiceResponse = await fetchJson<{client_invoice: CreateInvoiceResult}>(`${BASE_URI}/client_invoices/${invoiceId}/finalize`, {
            method: 'POST',
            headers: this.getHeaders(),
        })

        if (!createInvoiceResponse.client_invoice) {
            console.error(createInvoiceResponse)
            throw new Error(`[QONTO] Unable to finalize invoice`)
        }

        return await this.getInvoicePDF(invoiceId)
    }
}