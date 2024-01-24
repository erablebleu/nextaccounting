import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, handleApiCrudId } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { updateInvoiceTotal } from "../invoices/[id]";
import { updateQuotationTotal } from "../quotations/[id]";
import { JWT } from "next-auth/jwt";

export async function updateTotal(req: NextApiRequest, res: NextApiResponse, session: JWT, options: ApiOption, result: any) {
    if(result.invoiceId) {
        updateInvoiceTotal(req, res, session, options, result)
    }
    if(result.quotationId) {
        updateQuotationTotal(req, res, session, options, result)
    }
}

const options = {
    put: { role: UserRole.ADMIN, doAfter : updateTotal },
    get: { role: UserRole.ADMIN },
    delete: { role: UserRole.ADMIN, doAfter : updateTotal },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudId(req, res, prisma.invoiceItem, options);
}