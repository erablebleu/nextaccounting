import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { updateTotal } from "./[id]";

const options = {
    get: { role: UserRole.ADMIN, allowGenericFilters: true, orderBy: { index: 'asc' } },
    post: { role: UserRole.ADMIN, doAfter: updateTotal },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.invoiceItem, options)
}