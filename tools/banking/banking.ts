import { QontoClient } from "./qonto"

export interface IBankingClient {
    getTransactions(from: Date | null, to: Date): Promise<Array<any>>
}

export class BankingProvider {
    public static getClient(bankAccount): IBankingClient {
         switch (bankAccount.bank.toUpperCase()) {
            case 'QONTO': return new QontoClient(bankAccount.iban, bankAccount.apiInfo)
        }

        throw new Error(`Banking provider not supported: ${bankAccount.bank}`)
    }
}