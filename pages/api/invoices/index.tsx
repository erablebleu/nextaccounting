import { UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { ApiOption, getMonthFilter, getYearFilter, handleApiCrudIndex } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";
import { InvoiceItemUnit, InvoiceState } from "../../../tools/enums";
import dayjs from "dayjs";
import { IInvoiceGenerator, InvoiceGenerator } from "../../../tools/invoice/generator";

export async function getNextInvoiceNumber(): Promise<string> {
    const companyInfo = await prisma.companyInfo.findFirst()

    if (!companyInfo) {
        throw new Error('Missing company info')
    }

    return getNumber(companyInfo.invoiceNumberingFormat, new Date(), companyInfo.invoiceIndex + 1)
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
        callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => await prisma.invoice.findMany({
            include: { customer: true, revenues: { include: { bankTransaction: true } } },
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
                        { NOT: { state: InvoiceState.DRAFT } },
                        { NOT: { state: InvoiceState.CANCELED } },
                    ]),
                    getYearFilter(['issueDate'], req),
                    getMonthFilter(['issueDate'], req),
                ].filter(f => f !== undefined) as any
            },
            orderBy: { executionDate: 'desc' }
        })
    },
    post: {
        role: UserRole.ADMIN,
        callback: async (req: NextApiRequest, res: NextApiResponse, token: JWT, option: ApiOption) => {
            const id = req.body.id
            const generator: IInvoiceGenerator = await InvoiceGenerator.getGenerator()

            const data: any = {
                state: InvoiceState.DRAFT,                
                number: await generator.getInvoiceDraftNumber(),
                issueDate: new Date(),
                executionDate: new Date(),
                customerId: (await prisma.customer.findFirst())!.id,
                total: 0,
                totalVAT: 0,
                paymentDelay: 30,
            }

            if (id) { // COPY
                const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } })

                if (!invoice) {
                    throw new Error('Unknwon invoice')
                }

                data.title = invoice.title
                data.total = invoice.total
                data.totalVAT = invoice.totalVAT
                data.customerId = invoice.customerId
                data.items = {
                    createMany: {
                        data: invoice.items.map(item => ({
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
            else { // CREATE
                data.total = 0
                data.totalVAT = 0
            }

            return await prisma.invoice.create({ data })
        }
    },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    await handleApiCrudIndex(req, res, prisma.invoice, options)
}