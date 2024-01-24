import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { securize } from "../../../tools/api";
import { JWT } from "next-auth/jwt";
import { prisma } from "../../../tools/db";
import fs from 'fs';
import { readdir, stat } from 'fs/promises';
import path from "path";

async function dirSize(directory: string): Promise<number> {
    const files = await readdir(directory, { withFileTypes: true });

    const paths = files.map(async file => {
        const filePath = path.join(directory, file.name)        

        if (file.isDirectory()) {
            return await dirSize(filePath)
        }

        if (file.isFile()) {
            return (await stat(filePath)).size
        }

        return 0
    })

    return (await Promise.all(paths)).reduce((i: number, size: number) => i + size, 0);
}

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, undefined, async (token: JWT) => {
    const segments = req.query.index as string[]
    const customer = await prisma.customer.findFirst({ where: { contacts: { some: { user: { id: token.userId } } } } })
    const userPath = token.role == UserRole.ADMIN ? '' : `${customer?.dataPath}/`
    const fullpath = `${process.env.DATA_PATH}/${userPath}${segments?.join('/') ?? ''}/`

    if (fs.existsSync(fullpath)) {
        const stats = fs.statSync(fullpath)

        if (stats.isDirectory()) {
            return res.status(200).json(
                await Promise.all(fs.readdirSync(fullpath).map(async (file) => {
                    const stats = fs.statSync(fullpath + file)
                    return {
                        id: crypto.randomUUID(),
                        name: file,
                        type: stats.isDirectory() ? 'directory' : 'file',
                        size: stats.isDirectory() ? await dirSize(fullpath + file) : stats.size,
                        atime: stats.atime,
                        mtime: stats.mtime,
                        ctime: stats.ctime,
                    }
                })))
        }
        else {
            res.writeHead(200, {
                // 'Content-Type': 'audio/mpeg',
                'Content-Length': stats.size,
                'Content-Disposition': `filename=${path.parse(fullpath).base}`,
            })

            fs.createReadStream(fullpath).pipe(res)
            return
        }
    }

    return res.status(200).json([]);
})