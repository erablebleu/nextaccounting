import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";

const options = {
    get: { role: UserRole.ADMIN, orderBy: { name: 'asc' } },
    post: { role: UserRole.ADMIN },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.contact, options)
}