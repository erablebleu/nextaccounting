// import { prisma } from "./db";

enum UserRole {
    USER = 0,
    ADMIN = 1
}

enum InvoiceItemUnit {
    DAY,
    HOUR,
    UNIT,
    CLICK,
    PAGE,
    LINE,
    WORD,
    CHARACTER,
}

const InvoiceItemUnitLabel = new Map([
    [InvoiceItemUnit.DAY, 'Day'],
    [InvoiceItemUnit.HOUR, 'Hout'],
    [InvoiceItemUnit.UNIT, 'Unit'],
    [InvoiceItemUnit.CLICK, 'Click'],
    [InvoiceItemUnit.PAGE, 'Page'],
    [InvoiceItemUnit.LINE, 'Line'],
    [InvoiceItemUnit.WORD, 'Word'],
    [InvoiceItemUnit.CHARACTER, 'Character'],
])

enum InvoiceState {
    DRAFT,
    LOCKED,
    IMPORTED,
    CANCELED,
}

enum QuotationState {
    DRAFT,
    LOCKED,
    ACCEPTED,
    DENIED,
}

export {UserRole, InvoiceItemUnit, InvoiceState, QuotationState, InvoiceItemUnitLabel}