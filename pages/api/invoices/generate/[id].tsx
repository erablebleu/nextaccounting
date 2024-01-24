import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { PDF } from "../../../../tools/pdf";
import { InvoiceState } from "../../../../tools/enums";
import { Invoice } from "../../../../prisma/extensions";
import { getNextInvoiceNumber } from "..";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const id = req.query.id as string
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true, customer: true } })
    
    if(!invoice) {
        throw new Error('Unknwon invoice')
    }
    if(invoice.state != InvoiceState.DRAFT) {
        throw new Error('Invoice is not a draft')
    }

    invoice.number = await getNextInvoiceNumber()
    const buffer = await PDF.generate('invoice', invoice)

    await prisma.companyInfo.updateMany({ data: { invoiceIndex: { increment: 1, } } })    
    return res.status(200).json(await prisma.invoice.update({
        where: { id },
        data: {
            number: invoice.number,
            state: InvoiceState.LOCKED,
            total: Invoice.getTotal(invoice),
            totalVAT: Invoice.getTotalVAT(invoice),
            attachment: {
                create: {
                    filename: `${invoice.number}.pdf`,
                    attachmentData: {
                        create: {
                            data: buffer
                        }
                    },
                    shareLink: {
                        create: {
                        }
                    }
                }
            },
        }
    }));
})