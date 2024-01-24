import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { PDF } from "../../../../tools/pdf";
import { QuotationState } from "../../../../tools/enums";
import { Quotation } from "../../../../prisma/extensions";
import { getNextQuotationNumber } from "..";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const id = req.query.id as string
    const quotation = await prisma.quotation.findUnique({ where: { id }, include: { items: true, customer: true } })
    
    if(!quotation) {
        throw new Error('Unknwon quotation')
    }
    if(quotation.state != QuotationState.DRAFT) {
        throw new Error('Quotation is not a draft')
    }

    quotation.number = await getNextQuotationNumber()
    const buffer = await PDF.generate('quotation', quotation)

    await prisma.companyInfo.updateMany({ data: { quotationIndex: { increment: 1, } } })    
    return res.status(200).json(await prisma.quotation.update({
        where: { id },
        data: {
            number: quotation.number,
            state: QuotationState.LOCKED,
            total: Quotation.getTotal(quotation),
            totalVAT: Quotation.getTotalVAT(quotation),
            attachment: {
                create: {
                    filename: `${quotation.number}.pdf`,
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