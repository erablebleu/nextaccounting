import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, handleApiCrudId } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";

const options = {
    put: { role: UserRole.ADMIN },
    get: { role: UserRole.ADMIN },
    delete: {
        role: UserRole.ADMIN, doAfter: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption, result: any) => {
            if (result.attachmentId)
                await prisma.attachment.delete({ where: { id: result.attachmentId } })
        }
    },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudId(req, res, prisma.purchase, options)
}