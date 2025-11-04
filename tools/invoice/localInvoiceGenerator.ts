import { getNextInvoiceNumber } from "../../pages/api/invoices";
import { prisma } from "../db";
import { PDF } from "../pdf";
import { FinalizeInvoiceResult, IInvoiceGenerator } from "./generator";

export class LocalInvoiceGenerator implements IInvoiceGenerator {
    public async getInvoiceDraftNumber(): Promise<string | null> {
        return null
    }

    public async previewInvoice(invoice: any): Promise<Buffer> {
        invoice.number = await getNextInvoiceNumber()
        return await PDF.generate('invoice', invoice)
    }

    public async finalizeInvoice(invoice: any): Promise<FinalizeInvoiceResult> {        
        invoice.number = await getNextInvoiceNumber()
        
        const result = {
            number: invoice.number,
            pdfData:  await PDF.generate('invoice', invoice)
        }
        
        await prisma.companyInfo.updateMany({ data: { invoiceIndex: { increment: 1, } } })

        return result
    }
}