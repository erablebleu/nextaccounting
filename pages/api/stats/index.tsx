import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../../tools/db";
import { getYearFilter, handleApiCrudIndex, securize } from "../../../tools/api";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";
import dayjs from "dayjs";
import { Revenue } from "../../../prisma/extensions";

function dateFilter(start: Date, end: Date, value: any): Boolean {
    const date = new Date(value)
    // console.log(`datefilter - s:${start.toLocaleDateString()} e:${end.toLocaleDateString()} v:${value.toLocaleDateString()} -> ${date >= start && date < end}`)
    return date >= start && date < end
}

export default async (req: NextApiRequest, res: NextApiResponse) => securize(req, res, UserRole.ADMIN, async (token: JWT) => {
    const year = Number(req.query.y)
    const period = Math.floor(Number(req.query.period))
    const taxes = await prisma.tax.findMany()
    const purchases = await prisma.purchase.findMany({ where: getYearFilter('bankTransaction.settledDate'.split('.'), req), include: { bankTransaction: true } })
    const revenues = await prisma.revenue.findMany({ where: getYearFilter('bankTransaction.settledDate'.split('.'), req), include: { bankTransaction: true, invoice: true } })

    return res.status(200).json(Array.from(Array(Math.round(0.4999 + 12 / period)).keys()).map((idx: number) => {
        const sm = idx * period
        const em = Math.min(12, (idx + 1) * period)

        const start = new Date(year, sm, 1)
        const end = new Date(year, em, 1)

        const p = purchases.filter(purchase => dateFilter(start, end, purchase.bankTransaction.settledDate))
        const r = revenues.filter(revenue => dateFilter(start, end, revenue.bankTransaction.settledDate))
        const purchase = Prisma.Decimal.sum(0, ...p.map(purchase => purchase.amount))
        const revenue = Prisma.Decimal.sum(0, ...r.map(revenue => Revenue.getAmount(revenue)))
        const vatIn = Prisma.Decimal.sum(0, ...r.map(revenue => Revenue.getVAT(revenue)))
        const vatOut = Prisma.Decimal.sum(0, ...p.map(purchase => purchase.vat))

        // console.log(taxes)

        return {
            start, end,
            purchase, revenue,
            vatIn, vatOut,
            vatResult: vatIn.minus(vatOut),
            taxes: taxes.map(tax => ({
                name: tax.name,
                value: revenue.mul(tax.rate),
            })),
            name: (em - sm) > 1
                ? `${new Date(year, sm, 1).toLocaleString('default', { month: 'short' })} - ${new Date(year, em - 1, 1).toLocaleString('default', { month: 'short' })}`
                : new Date(year, sm, 1).toLocaleString('default', { month: 'long' }),
        }
    }));
})