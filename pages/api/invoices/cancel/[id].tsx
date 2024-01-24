import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { prisma } from "../../../../tools/db";
import { InvoiceState } from "../../../../tools/enums";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const id = req.query.id as string
    const invoice = await prisma.invoice.findUnique({ where: { id } })

    if (invoice?.state != InvoiceState.LOCKED) {
        throw new Error('Invoice must be locked to be canceled')
    }

    return res.status(200).json(await prisma.invoice.update({
        where: { id },
        data: { state: InvoiceState.CANCELED }
    }));
})