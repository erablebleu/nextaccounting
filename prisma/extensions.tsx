import { Prisma } from "@prisma/client";
import { InvoiceState, QuotationState } from "../tools/enums";

export class BankTransaction {
    public static isCredit(bankTransaction): boolean {
        const amount = new Prisma.Decimal(bankTransaction.amount)
        return !amount.isZero() && amount.isPos()
    }
    public static isDebit(bankTransaction): boolean {
        const amount = new Prisma.Decimal(bankTransaction.amount)
        return !amount.isZero() && amount.isNeg()
    }
    public static isFullyAssociated(bankTransaction): boolean {
        return this.isCredit(bankTransaction)
            ? new Prisma.Decimal(bankTransaction.amount).eq(Prisma.Decimal.sum(0, ...bankTransaction.revenues.map(r => r.amount)))
            : Prisma.Decimal.abs(bankTransaction.amount).eq(Prisma.Decimal.sum(0, ...bankTransaction.purchases.map(p => Prisma.Decimal.add(p.amount, p.vat))))
    }
    public static hasAssociation(bankTransaction): boolean {
        return this.isCredit(bankTransaction)
            ? bankTransaction.revenues.length > 0
            : bankTransaction.purchases.length > 0
    }
}

export class Invoice {
    public static isFullyPaid(invoice): boolean {
        return Prisma.Decimal.add(invoice.total, invoice.totalVAT).eq(Invoice.paidPart(invoice))
    }
    public static paidPart(invoice): Prisma.Decimal {
        return Prisma.Decimal.sum(0, ...invoice.revenues.map(r => r.amount))
    }
    public static isDraft(invoice): boolean {
        return invoice.state == InvoiceState.DRAFT
    }
    public static isLocked(invoice): boolean {
        return invoice.state == InvoiceState.LOCKED
    }
    public static isImported(invoice): boolean {
        return invoice.state == InvoiceState.IMPORTED
    }
    public static isCanceled(invoice): boolean {
        return invoice.state == InvoiceState.CANCELED
    }
    public static getTotal(invoice): Prisma.Decimal {
        return Prisma.Decimal.sum(0, ...invoice.items.map(item => InvoiceItem.getTotal(item)))
    }
    public static getTotalVAT(invoice): Prisma.Decimal {
        return Prisma.Decimal.sum(0, ...invoice.items.map(item => InvoiceItem.getTotalVAT(item)))
    }
}

export class Quotation {
    public static isDraft(quotation): boolean {
        return quotation.state == QuotationState.DRAFT
    }
    public static isLocked(quotation): boolean {
        return quotation.state == QuotationState.LOCKED
    }
    public static isAccepted(quotation): boolean {
        return quotation.state == QuotationState.ACCEPTED
    }
    public static isDenied(quotation): boolean {
        return quotation.state == QuotationState.DENIED
    }
    public static getTotal(quotation): Prisma.Decimal {
        return Prisma.Decimal.sum(0, ...quotation.items.map(item => InvoiceItem.getTotal(item)))
    }
    public static getTotalVAT(quotation): Prisma.Decimal {
        return Prisma.Decimal.sum(0, ...quotation.items.map(item => InvoiceItem.getTotalVAT(item)))
    }
}

export class InvoiceItem {
    public static getTotal(item): Prisma.Decimal {
        return Prisma.Decimal.mul(item.quantity, item.price)
    }
    public static getTotalVAT(item): Prisma.Decimal {
        return Prisma.Decimal.mul(InvoiceItem.getTotal(item), item.vatRate)
    }
}

export class Revenue {
    public static getAmount(revenue): Prisma.Decimal {
        return Prisma.Decimal.mul(revenue.amount, revenue.invoice.total).div(Prisma.Decimal.add(revenue.invoice.total, revenue.invoice.totalVAT))
    }
    public static getVAT(revenue): Prisma.Decimal {
        return Prisma.Decimal.mul(revenue.amount, revenue.invoice.totalVAT).div(Prisma.Decimal.add(revenue.invoice.total, revenue.invoice.totalVAT))
    }
}