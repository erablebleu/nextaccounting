import { QontoClient } from "./qonto"

export type GetTransactionsParameters = {
    iban: string
    from: Date | null
    to: Date
}

export interface IBankingClient {
    getTransactions(parameters: GetTransactionsParameters): Promise<Array<any>>
}

export class BankingProvider {
    public static getClient(bankAccount): IBankingClient {
         switch (bankAccount.bank.toUpperCase()) {
            case 'QONTO': return new QontoClient(bankAccount.apiInfo)
        }

        throw new Error(`Banking provider not supported: ${bankAccount.bank}`)
    }
}