import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";

const options = {
    get: {
        role: UserRole.ADMIN,
        orderBy: { createdAt: 'desc' }
     },
    post: { role: UserRole.ADMIN },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.bankAccount, options)
}