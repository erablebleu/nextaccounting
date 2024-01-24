import { Prisma } from "@prisma/client";

export function decimalSum<T>(array: Array<T>, selector: (value: T) => Prisma.Decimal): Prisma.Decimal {
    return array.reduce((a: Prisma.Decimal, b: T) => a.add(selector(b)), new Prisma.Decimal(0))
}