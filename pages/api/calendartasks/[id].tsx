import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { handleApiCrudId } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";

const options = {
    put: { role: UserRole.ADMIN },
    get: { role: UserRole.ADMIN },
    delete: { role: UserRole.ADMIN },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudId(req, res, prisma.calendarTask, options);
}