import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { InvoiceState } from "../../../../tools/enums";
import { Invoice } from "../../../../prisma/extensions";
import { IInvoiceGenerator, InvoiceGenerator } from "../../../../tools/invoice/generator";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const id = req.query.id as string
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true, customer: true } })

    if (!invoice) {
        throw new Error('Unknwon invoice')
    }
    if (invoice.state != InvoiceState.DRAFT) {
        throw new Error('Invoice is not a draft')
    }

    const generator: IInvoiceGenerator = await InvoiceGenerator.getGenerator()
    const invoiceResult = await generator.finalizeInvoice(invoice)

    const result = await prisma.invoice.update({
        where: { id },
        data: {
            number: invoiceResult.number,
            state: InvoiceState.LOCKED,
            total: Invoice.getTotal(invoice),
            totalVAT: Invoice.getTotalVAT(invoice),
            attachment: {
                create: {
                    filename: `${invoice.number}.pdf`,
                    attachmentData: {
                        create: {
                            data: invoiceResult.pdfData
                        }
                    },
                    shareLink: {
                        create: {
                        }
                    }
                }
            },
        }
    })

    return res.status(200).json(result)
})