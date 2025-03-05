import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, handleApiCrudId } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";
import { Quotation } from "../../../prisma/extensions";
import { QuotationState } from "../../../tools/enums";

export async function updateQuotationTotal(req: NextApiRequest, res: NextApiResponse, session: JWT, options: ApiOption, result: any) {
    const quotation = await prisma.quotation.findUnique({ where: { id: result.quotationId }, include: { items: true } })
    await prisma.quotation.update({
        where: { id: result.quotationId },
        data: {
            total: Quotation.getTotal(quotation),
            totalVAT:  Quotation.getTotalVAT(quotation),
        }
    })
}

const options = {
    put: { role: UserRole.ADMIN, callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => {
        const id = req.query.id as string
        const quotation = await prisma.quotation.findUnique({ where: { id }, include: { items: true } })

        if(quotation?.state != QuotationState.DRAFT) {
            throw new Error(`Quotation can't be updated`)
        }

        return await prisma.quotation.update({
            where: { id },
            data: {
                ...req.body,
                total: Quotation.getTotal(quotation),
                totalVAT:  Quotation.getTotalVAT(quotation),
            }
        })
    } },
    get: { role: UserRole.ADMIN },
    delete: { role: UserRole.ADMIN },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudId(req, res, prisma.quotation, options);
}