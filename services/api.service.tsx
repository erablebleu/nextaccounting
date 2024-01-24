import { NextResponse } from "next/server";

const baseUrl = '/api'

export class ApiService {
    url: string;

    constructor(url: string) {
        this.url = `${baseUrl}/${url}`
    }

    public async getAll() {
        return await fetchAndThrow(`${this.url}`, { method: 'GET' })
    }

    public async getById(key: string) {
        return await fetchAndThrow(`${this.url}/${key}`, { method: 'GET' })
    }

    public async create(params: any) {
        return await fetchAndThrow(`${this.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })
    }

    public async update(key: string, params: any) {
        return fetchAndThrow(`${this.url}/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })
    }

    public async delete(id: string) {
        return await fetchAndThrow(`${this.url}/${id}`, { method: 'DELETE' })
    }
}

async function fetchAndThrow(url: string, options: any): Promise<Response> {
    const res: Response = await fetch(url, options)

    if (!res.ok) {
        const error = new Error((await res.json()).error)
        throw error
    }

    return res;
}

export const api = {
    user: new ApiService('users'),
    contact: new ApiService('contacts'),
    customer: new ApiService('customers'),
    invoice: new ApiService('invoices'),
    quotation: new ApiService('quotations'),
    invoiceItem: new ApiService('invoiceitems'),
    purchase: new ApiService('purchases'),
    revenue: new ApiService('revenues'),
    bankAccount: new ApiService('bankaccounts'),
    bankTransaction: new ApiService('banktransactions'),
    tax: new ApiService('taxes'),
    companyInfo: new ApiService('companyinfos'),
    calendarTask: new ApiService('calendartasks'),
}