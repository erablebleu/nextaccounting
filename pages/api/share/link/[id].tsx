import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../../tools/api";
import { UserRole } from "@prisma/client";
import { JWT } from "next-auth/jwt";
import { encrypt } from "../../../../tools/crypto";

export default async (req: NextApiRequest, res: NextApiResponse)  => securize(req, res, UserRole.ADMIN, async (token: JWT) => {
    return res.status(200).json({ encoded: encrypt(req.query.id as string) });
})