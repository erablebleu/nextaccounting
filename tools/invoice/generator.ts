import { QontoClient } from "../banking/qonto"
import { prisma } from "../db"
import { LocalInvoiceGenerator } from "./localInvoiceGenerator"

export type FinalizeInvoiceResult = {
    number: string
    pdfData: Buffer
}

export interface IInvoiceGenerator {
    getInvoiceDraftNumber(): Promise<string | null>
    previewInvoice(invoice: any): Promise<Buffer>
    finalizeInvoice(invoice: any): Promise<FinalizeInvoiceResult>
}

export class InvoiceGenerator {
    public static async getGenerator(): Promise<IInvoiceGenerator> {
         switch (process.env.INVOICE_GENERATOR?.toUpperCase()) {
            case 'QONTO':             
                // Look for banking account
                const bankAccount = (await prisma.bankAccount.findMany({
                    where: {
                        bank: {
                            equals: 'QONTO',
                            mode: 'insensitive',
                        }
                    }
                }))[0]

                return new QontoClient(bankAccount.iban, bankAccount.apiInfo)
                
            case 'LOCAL':
            default:
                return new LocalInvoiceGenerator()
        }
    }
}