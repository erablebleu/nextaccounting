import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";

const options = {
    get: { role: UserRole.ADMIN, orderBy: { invoice: { issueDate: 'desc' } }, allowGenericFilters: true,  include: { invoice: true, bankTransaction: true }, dateProperty: 'bankTransaction.settledDate' },
    post: { role: UserRole.ADMIN },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.revenue, options)
}