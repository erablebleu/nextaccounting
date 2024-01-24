import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";

const options = {
    get: { role: UserRole.ADMIN, allowGenericFilters: true, include: { attachment: true, bankTransaction: true }, dateProperty: 'bankTransaction.settledDate' },
    post: {
        role: UserRole.ADMIN, callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => {
            req.body.attachment.create.attachmentData.create.data = Buffer.from(req.body.attachment.create.attachmentData.create.data as string, 'base64')
            return prisma.purchase.create({ data: req.body })
        }
    },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.purchase, options)
}