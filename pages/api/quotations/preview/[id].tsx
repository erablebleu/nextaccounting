import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { PDF } from "../../../../tools/pdf";
import { getNextQuotationNumber } from "..";
import { QuotationState } from "../../../../tools/enums";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {   
    const quotation = await prisma.quotation.findUnique({ where: { id: req.query.id as string }, include: { items: true, customer: true } })
    
    if(!quotation) {
        throw new Error('Unknwon quotation')
    }
    if(quotation.state != QuotationState.DRAFT) {
        throw new Error('Quotation is not a draft')
    }

    quotation.number = await getNextQuotationNumber()
    const buffer = await PDF.generate('quotation', quotation)
    res.writeHead(200, {
        'accept-ranges': 'bytes',
        'Content-Length': buffer.length,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `filename=${quotation!.number}.pdf`,
    })
    res.write(buffer)
    res.end()
})