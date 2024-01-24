import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { PDF } from "../../../../tools/pdf";
import { getNextInvoiceNumber } from "..";
import { InvoiceState } from "../../../../tools/enums";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {   
    const invoice = await prisma.invoice.findUnique({ where: { id: req.query.id as string }, include: { items: true, customer: true } })
    
    if(!invoice) {
        throw new Error('Unknwon invoice')
    }
    if(invoice.state != InvoiceState.DRAFT) {
        throw new Error('Invoice is not a draft')
    }

    invoice.number = await getNextInvoiceNumber()
    const buffer = await PDF.generate('invoice', invoice)
    res.writeHead(200, {
        'accept-ranges': 'bytes',
        'Content-Length': buffer.length,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `filename=${invoice!.number}.pdf`,
    })
    res.write(buffer)
    res.end()
})