import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, handleApiCrudId } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";
import { Invoice } from "../../../prisma/extensions";
import { InvoiceState } from "../../../tools/enums";

export async function updateInvoiceTotal(req: NextApiRequest, res: NextApiResponse, session: JWT, options: ApiOption, result: any) {
    const invoice = await prisma.invoice.findUnique({ where: { id: result.invoiceId }, include: { items: true } })
    await prisma.invoice.update({
        where: { id: result.invoiceId },
        data: {
            total: Invoice.getTotal(invoice),
            totalVAT:  Invoice.getTotalVAT(invoice),
        }
    })
}

const options = {
    put: { role: UserRole.ADMIN, callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => {
        const id = req.query.id as string
        const invoice = await prisma.invoice.findUnique({ where: { id } })

        if(invoice?.state != InvoiceState.DRAFT) {
            throw new Error(`Invoice can't be updated`)
        }

        return await prisma.invoice.update({
            where: { id },
            data: req.body,
        })
    } },
    get: { role: UserRole.ADMIN },
    delete: { role: UserRole.ADMIN },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudId(req, res, prisma.invoice, options);
}