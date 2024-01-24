import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { securize } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async () => {
    const allTransactions: Array<any> = []
    const date = new Date()

    for(const bankAccount of await prisma.bankAccount.findMany()) {
        switch(bankAccount.bank.toUpperCase()) {
            case 'QONTO':
                const transactions: Array<any> = []
                var uri = `https://thirdparty.qonto.com/v2/transactions?sort_by=settled_at:asc&iban=${bankAccount.iban.replaceAll(' ', '')}`
                var page = 1
                
                if(bankAccount.lastSyncDate) {
                    uri += `&settled_at_from=${dayjs(bankAccount.lastSyncDate).toISOString()}`
                }
                uri += `&settled_at_to=${dayjs(date).toISOString()}`

                var qdata: any = undefined
                do {
                    // console.log(`fetch at ${uri + `&current_page=${page}`}`)
                    const qres = await fetch(uri + `&current_page=${page}`, { method: 'GET', headers: {
                        accept: 'application/json, text/plain',
                        authorization: bankAccount.apiInfo,
                    } })
                    qdata = await qres.json()
                    
                    for(const transaction of qdata.transactions) {
                        if(!await prisma.bankTransaction.findFirst({ where: { transactionId: transaction.transaction_id }})){
                            transactions.push({
                                bankAccountId: bankAccount.id,
                                amount: transaction.side == 'debit' ? -transaction.amount : transaction.amount,
                                label: transaction.label,
                                reference: transaction.reference,
                                settledDate: transaction.settled_at,
                                transactionId: transaction.transaction_id,
                            })
                        }
                    }

                    page++

                } while(qdata?.meta?.next_page)

                await prisma.bankTransaction.createMany({
                    data: transactions
                })

                await prisma.bankAccount.update({
                    where: {
                        id: bankAccount.id
                    },
                    data: {
                        lastSyncDate: date
                    }
                })

                allTransactions.push(...transactions)
            break
        }
    }

    return res.status(200).json({ transactions: allTransactions })
})