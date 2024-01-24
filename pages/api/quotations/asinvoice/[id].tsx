import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { InvoiceState, QuotationState } from "../../../../tools/enums";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const id = req.query.id as string
    const quotation = await prisma.quotation.findUnique({ where: { id }, include: { items: true } })

    if (!quotation) {
        throw new Error('Unknwon quotation')
    }

    return res.status(200).json(await prisma.invoice.create({        
        data: {
            state: InvoiceState.DRAFT,
            issueDate: new Date(),
            executionDate: new Date(),
            paymentDelay: 30,
            title: quotation.title,
            total: quotation.total,
            totalVAT: quotation.totalVAT,
            customerId: quotation.customerId,
            items: {
                createMany: {
                    data: quotation.items.map(item => ({
                        description: item.description,
                        price: item.price,
                        quantity: item.quantity,
                        title: item.title,
                        unit: item.unit,
                        vatRate: item.vatRate,
                        index: item.index,
                    }))
                }
            }
        }
    }));
})