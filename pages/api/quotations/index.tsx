import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, getMonthFilter, getYearFilter, handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";
import { JWT } from "next-auth/jwt";
import { InvoiceItemUnit, QuotationState } from "../../../tools/enums";

export async function getNextQuotationNumber(): Promise<string> {
    const companyInfo = await prisma.companyInfo.findFirst()

    if (!companyInfo) {
        throw new Error('Missing company info')
    }

    return getNumber(companyInfo.quotationNumberingFormat, new Date(), companyInfo.quotationIndex + 1)
}

function getNumber(format: string, date: Date, number: number): string {
    return format.replace(/{(.*?)}/g, (match, value) => {
        const el = value.split(':')
        const idx = Number(el[0])

        switch (idx) {
            case 0: return dayjs(date).format('YYYYMM')
            case 1: return String(number).padStart(3, '0')
            default: return ''
        }
    })
}

const options = {
    get: {
        callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => await prisma.quotation.findMany({
            include: { customer: true },
            where: {
                AND: [
                    ...(token.role == UserRole.ADMIN ? [] : [
                        {
                            customer: {
                                contacts: {
                                    some: {
                                        user: {
                                            id: token.userId
                                        }
                                    }
                                }
                            }
                        },
                        { NOT: { state: QuotationState.DRAFT } },
                    ]),
                    getYearFilter(['issueDate'], req),
                    getMonthFilter(['issueDate'], req),
                ].filter(f => f !== undefined) as any
            },
            orderBy: { issueDate: 'desc' }
        })
    },
    post: {
        role: UserRole.ADMIN,
        callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => {
            const id = req.body.id

            const data: any = {
                state: QuotationState.DRAFT,
                issueDate: new Date(),
                customerId: (await prisma.customer.findFirst())!.id,
                total: 0,
                totalVAT: 0,
                validity: 30,
            }

            if (id) {
                const quotation = await prisma.quotation.findUnique({ where: { id }, include: { items: true } })
                if (!quotation) {
                    throw new Error('Unknwon quotation')
                }
                data.title = quotation.title
                data.total = quotation.total
                data.totalVAT = quotation.totalVAT
                data.customerId = quotation.customerId
                data.items = {
                    createMany: {
                        data: quotation.items.map(item => ({
                            description: item.description,
                            price: item.price,
                            quantity: item.quantity,
                            title: item.title,
                            unit: item.unit,
                            vatRate: item.vatRate,
                            index: item.index,
                        }))
                    }
                }
            }
            else {
                data.total = 0
                data.totalVAT = 0
            }

            return await prisma.quotation.create({ data })
        }
    },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.quotation, options)
}