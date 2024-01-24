import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "../../../tools/db";
import { decrypt } from "../../../tools/crypto";

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const token = await getToken({ req: req })
    var id = req.query.id as string

    if(id.length > 30) { // encrypted id
        id = decrypt(id)
    }
    
    const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
            attachmentData: true,
            invoice: token?.role == UserRole.USER,
            quotation: token?.role == UserRole.USER,
            shareLink: !token
        }
    })

    if (!token 
        && (req.query.id as string == id || !attachment?.shareLink || attachment.shareLink.validity && attachment.shareLink.validity < new Date())) {
        res.status(401).json({ message: "you are not allowed" })
        return
    }

    if (!attachment) {
        res.status(500).json({ error: 'Unknown attachment' })
        return
    }

    if (token?.role == UserRole.USER) {
        const user = await prisma.user.findUnique({ where: { id: token.userId }, include: { contact: true } })

        if (!user?.contact
            || user.contact.customerId != (attachment?.invoice?.customerId ?? attachment?.quotation?.customerId)) {
            res.status(401).json({ message: "you are not allowed" })
            return
        }
    }

    res.writeHead(200, {
        'accept-ranges': 'bytes',
        'Content-Type': 'application/pdf',
        'Content-Length': attachment?.attachmentData?.data.length,
        'Content-Disposition': `filename=${attachment?.filename}`,
    })
    res.write(attachment?.attachmentData?.data)
    res.end()
}