import dayjs from "dayjs";
import { GetTransactionsParameters, IBankingClient } from "./banking";

const BASE_URI = 'https://thirdparty.qonto.com/v2'

export class QontoClient implements IBankingClient {
    constructor(private _authorization: string) { }

    private getHeaders(): any {
        return {
            accept: 'application/json, text/plain',
            authorization: this._authorization,
        }
    }

    public async getTransactions(parameters: GetTransactionsParameters): Promise<Array<any>> {
        const result: Array<any> = []
        var uri = `${BASE_URI}/transactions?sort_by=settled_at:asc&iban=${parameters.iban.replaceAll(' ', '')}`
        var page = 1

        // Format uri
        if (parameters.from) {
            uri += `&settled_at_from=${dayjs(parameters.from).toISOString()}`
        }
        uri += `&settled_at_to=${dayjs(parameters.to).toISOString()}`

        // Page read loop
        var qdata: any = undefined
        do {
            const qres: Response = await fetch(uri + `&current_page=${page}`, {
                method: 'GET',
                headers: this.getHeaders()
            })
            qdata = await qres.json()

            result.push(...qdata.transactions.map(transaction => ({
                amount: transaction.side == 'debit' ? -transaction.amount : transaction.amount,
                label: transaction.label,
                reference: transaction.reference,
                settledDate: transaction.settled_at,
                transactionId: transaction.transaction_id,
            })))

            page++

        } while (qdata?.meta?.next_page)

        return result
    }
}