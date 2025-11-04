import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { InvoiceState } from "../../../../tools/enums";
import { IInvoiceGenerator, InvoiceGenerator } from "../../../../tools/invoice/generator";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {   
    const invoice = await prisma.invoice.findUnique({ where: { id: req.query.id as string }, include: { items: true, customer: true } })
    
    if(!invoice) {
        throw new Error('Unknwon invoice')
    }
    if(invoice.state != InvoiceState.DRAFT) {
        throw new Error('Invoice is not a draft')
    }
    
    const generator: IInvoiceGenerator = await InvoiceGenerator.getGenerator()
    const buffer = await generator.previewInvoice(invoice)

    res.writeHead(200, {
        'accept-ranges': 'bytes',
        'Content-Length': buffer.length,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `filename=${invoice!.number}.pdf`,
    })
    res.write(buffer)
    res.end()
})