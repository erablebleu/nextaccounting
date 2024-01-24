import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { QuotationState } from "../../../../tools/enums";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const id = req.query.id as string
    const quotation = await prisma.quotation.findUnique({ where: { id }, include: { items: true, customer: true } })

    if (!quotation) {
        throw new Error('Unknwon quotation')
    }
    if (quotation.state != QuotationState.LOCKED) {
        throw new Error('Quotation is not locked')
    }

    return res.status(200).json(await prisma.quotation.update({
        where: { id },
        data: {
            number: quotation.number,
            state: QuotationState.ACCEPTED,
        }
    }));
})