import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { securize } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { BankingProvider, IBankingClient } from "../../../tools/banking/banking";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const result: Array<any> = []
    const date = new Date()

    for (const bankAccount of await prisma.bankAccount.findMany()) {
        const client: IBankingClient = BankingProvider.getClient(bankAccount)

        const allTransactions: Array<any> = await client.getTransactions(bankAccount.lastSyncDate, date)
        const existingTransactions = await prisma.bankTransaction.findMany({
            where: {
                transactionId: {
                    in: allTransactions.map(transaction => transaction.transactionId)
                }
            },
            select: {
                transactionId: true
            }
        })
        const existingIds = existingTransactions.map(transaction => transaction.transactionId)
        const newTransactions: Array<any> = allTransactions.filter(transaction => !existingIds.includes(transaction.transactionId))

        if (newTransactions.length > 0) {
            await prisma.bankTransaction.createMany({
                data: newTransactions.map(transaction => ({
                    ...transaction,
                    bankAccountId: bankAccount.id,
                }))
            })
        }

        await prisma.bankAccount.update({
            where: { id: bankAccount.id },
            data: { lastSyncDate: date }
        })

        result.push(...newTransactions)
    }

    return res.status(200).json({ transactions: result })
})