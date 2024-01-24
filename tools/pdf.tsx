import { prisma } from "./db";
import PDFDocument from 'pdfkit';
import dayjs from "dayjs";
import { InvoiceItem, Prisma } from "@prisma/client";
var fs = require('fs');

const normalColor = '#646464'
const lightColor = '#b4b4b4'
const glowingColor = '#16c60c'
const shadingColor = '#f5f5f5'
const units_fr = ['jour', 'heure', 'unité', 'clic', 'page', 'ligne', 'mot', 'caractère']
const margins = {
    left: 50,
    right: 50,
    top: 60,
    bottom: 80
}
const date = (value: any) => dayjs(value).format('DD/MM/YYYY')
const amountFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
const amountFormat00 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const amount = (value: Prisma.Decimal) =>
    (value.floor().eq(value)
        ? amountFormat.format(value.toNumber())
        : amountFormat00.format(value.toNumber()))
        .replace('\u202F', ' ')
const unit = (value: number, unit: number) => `${value} ${units_fr[unit]}${value > 1 ? 's' : ''}`
const percentage = (value: Prisma.Decimal) => `${value.mul(100).floor().toString()}%`

export class PDFGenerator extends PDFDocument {
    constructor(
        private mode: 'invoice' | 'quotation',
        private companyInfo: any,
        private bankAccount: any,
        private source: any,
    ) {
        super({
            bufferPages: true,
            autoFirstPage: false,
            size: 'A4',
            margins: structuredClone(margins),
            font: 'resources/fonts/Avenir Next LT Pro Regular.ttf',
        })
        this.registerFonts()
        this.addPage()

        this.addCompanyInfo()
        this.addDocumentTitle()
        this.addCustomerInfo()
        this.addItems()
        this.addBankingInfo()
        this.addConditions()

        this.addHeaderFooter()
    }

    private bold(bold: boolean, size?: number): this {
        this.font(bold ? 'Avenir Next LT Pro Medium' : 'Avenir Next LT Pro Regular', size)
        return this
    }

    private registerFonts() {
        this.registerFont('Avenir Next LT Pro Regular', fs.readFileSync(`resources/fonts/Avenir Next LT Pro Regular.ttf`))
        this.registerFont('Avenir Next LT Pro Medium', fs.readFileSync(`resources/fonts/Avenir Next LT Pro Medium.ttf`))
    }

    private addCompanyInfo() {
        this.moveDown(0.5)
        const y = this.y

        this.fillColor(normalColor)
            .bold(true, 12)
            .text(`${this.companyInfo.name} ${this.companyInfo.legalStatus}`)
            .bold(false, 10)
            .text(`SIRET : ${this.companyInfo.siret}`)
            .text(`TVA : ${this.companyInfo.vat}`)

        this.y = y
        this.text(`${this.companyInfo.mail}`, { align: 'right' })
            .text(`${this.companyInfo.phoneNumber}`, { align: 'right' })
            .text(`${this.companyInfo.address}`, { align: 'right' })
    }

    private addDocumentTitle() {
        this.moveDown(2)
            .bold(true, 14)
            .text(this.mode == 'invoice' ? `FACTURE` : 'DEVIS', { align: 'center' })
            .bold(false, 14)
            .text(`N°${this.source.number}`, { align: 'center' })

        if (this.source.title) {
            this.moveDown(1.5)
                .bold(false, 12)
                .text(this.source.title)
        }
    }

    private addCustomerInfo() {
        this.moveDown(1.5)
        const y = this.y
        this.bold(false, 10)
            .fillColor(lightColor)
            .text(`CLIENT`)
            .text(`SIREN`)
            .text(`N°TVA`)
            .text(`ADRESSE`)
            .text(`ÉMIS LE`)
            .text(this.mode == 'invoice' ? `EXÉCUTION` : 'VALIDITÉ')

        this.y = y
        this.fillColor(normalColor)
            .text(`${this.source.customer.name}`, 130)
            .text(`${this.source.customer.siren}`)
            .text(`${this.source.customer.vat} `)
            .text(`${this.source.customer.address.replace('\n', ', ')}`)
            .text(`${date(this.source.executionDate)}`)
            .text(`${date(this.mode == 'invoice' ? this.source.issueDate : dayjs(this.source.issueDate).add(this.source.validity, 'day'))}`)
    }

    private addItems() {
        this.moveDown(1.5)
        const headers = [`Prestation`, `Quantité`, `TVA`, `Unité HT`, `HT`, `TTC`]
        const columns = [12, 3, 2, 3, 3, 3]
        const width = this.page.width - margins.left - margins.right
        const widthFactor = width / columns.reduce((a: number, b: number) => a + b, 0)

        const drawHeaders = () => {
            const x = this.x
            const y = this.y
            var offsetX = margins.left

            this.bold(true, 10)
                .rect(margins.left - 5, y - 6, width + 10, 20)
                .fill(shadingColor)
                .moveTo(x, y)
                .fillColor(normalColor)

            for (var i = 0; i < headers.length; i++) {
                this.text(headers[i], offsetX, y, { width: columns[i] * widthFactor, align: i == 0 ? 'left' : 'right' })
                offsetX += columns[i] * widthFactor
            }
        }

        drawHeaders()

        this.source.items.sort((a: InvoiceItem, b: InvoiceItem) => a.index - b.index)

        for (const item of this.source.items) {

            this.moveDown(1)
            this.bold(true, 10)
            var height = this.heightOfString(item.title, { width: columns[0] * widthFactor })
            this.bold(false, 9)
            height += this.heightOfString(item.description, { width: columns[0] * widthFactor - 10 })

            if (this.y + height > this.page.height - margins.bottom) {
                this.addPage()
                    .moveDown(1)
                drawHeaders()
                this.moveDown(1)
            }

            var offsetX = margins.left
            const initY = this.y
            this.bold(false, 10)

            const y = initY + (height - this.heightOfString('x')) / 2
            const total = Prisma.Decimal.mul(item.price, item.quantity)
            const totalVAT = Prisma.Decimal.mul(Prisma.Decimal.add(1, item.vatRate), total)
            const data = [unit(item.quantity, item.unit), percentage(item.vatRate), amount(item.price), amount(total), amount(totalVAT)]

            for (var i = 0; i < data.length; i++) {
                offsetX += columns[i] * widthFactor
                this.text(data[i], offsetX, y, { width: columns[i + 1] * widthFactor, align: 'right' })
            }

            this.bold(true, 10)
                .text(item.title, margins.left, initY, { width: columns[0] * widthFactor })
                .bold(false, 9)
                .text(item.description, margins.left + 10, undefined, { width: columns[0] * widthFactor - 10 })
        }

        // Total
        this.bold(false, 10)
        var height = this.heightOfString('Total HT')
        this.bold(false, 8)
        height += this.heightOfString('Total TVA')
        this.bold(true, 10)
        height += this.heightOfString('Total TTC') + 50

        if (this.y + height > this.page.height - margins.bottom) {
            this.addPage()
                .moveDown(1)
        }
        else {            
            this.moveDown(4)
        }

        const total = Prisma.Decimal.sum(...this.source.items.map(item => Prisma.Decimal.mul(item.price, item.quantity)))
        const vat = Prisma.Decimal.sum(...this.source.items.map(item => Prisma.Decimal.mul(item.price, item.quantity).mul(item.vatRate)))
        const totalVAT = Prisma.Decimal.add(total, vat)
        const left = 390

        this.bold(false, 10)
            .text('Total HT', left, undefined, { continued: true })
            .text(amount(total), left, undefined, { align: 'right' })

            .bold(false, 8)
            .text('Total TVA', left, undefined, { continued: true })
            .text(amount(vat), left - 2.2, undefined, { align: 'right' })

            .moveDown(0.5)
            .bold(true, 10)
            .fillColor(glowingColor)
            .text('Total TTC', left, undefined, { continued: true })
            .text(amount(totalVAT), left, undefined, { align: 'right' })
    }

    private addBankingInfo() {
        this.moveDown(5)

        this.bold(true, 12)
        var height = 2 * this.heightOfString('x')
        this.bold(false, 10)
        height += 5 * this.heightOfString('x')
        this.bold(false, 8)
        height += this.heightOfString(this.mode == 'invoice' ? this.companyInfo.invoiceCustomFooter : this.companyInfo.quotationCustomFooter, { width: this.page.width - margins.left - margins.right - 130 })

        if (this.y + height > this.page.height - margins.bottom) {
            this.addPage()
        }

        this.fillColor(normalColor)
            .bold(true, 12)
            .text(`PAIEMENT`, margins.left, this.page.height - margins.bottom - height)
            .bold(false, 10)
            .fillColor(lightColor)
            .text(`Banque : `, 130, this.y, { continued: true })
            .fillColor(normalColor)
            .text(`${this.bankAccount.bank}`)
            .fontSize(8)
            .fillColor(lightColor)
            .text(`IBAN : `, { continued: true })
            .fillColor(normalColor)
            .text(`${this.bankAccount.iban}  `, { continued: true })
            .fillColor(lightColor)
            .text(`RIB : `, { continued: true })
            .fillColor(normalColor)
            .text(`${this.bankAccount.rib}  `, { continued: true })
            .fillColor(lightColor)
            .text(`BIC : `, { continued: true })
            .fillColor(normalColor)
            .text(`${this.bankAccount.bic}  `)
    }

    private addConditions() {
        this.moveDown(3)
            .bold(true, 12)
            .text(`CONDITIONS`, margins.left)
            .bold(false, 8)
            .text(this.mode == 'invoice' ? this.companyInfo.invoiceCustomFooter : this.companyInfo.quotationCustomFooter, 130)

    }

    // HEADER && FOOTER        
    private addHeaderFooter() {
        const pages = this.bufferedPageRange()

        for (let i = 0; i < pages.count; i++) {
            this.switchToPage(i);

            this.bold(false, 10)

            // HEADER
            const oldTopMargin = this.page.margins.top;
            this.page.margins.top = 0
            this.fillColor(normalColor)
                .text(`${this.mode == 'invoice' ? 'Facture' : 'Devis'} N°${this.source.number}`, 0, 40, { align: 'right' })
            this.fillColor('black')
                .moveTo(47, margins.top - 5)
                .lineTo(this.page.width - 47, margins.top - 5)
                .lineWidth(0.3).stroke()
            this.page.margins.top = oldTopMargin; // ReProtect top margin

            // FOOTER
            const oldBottomMargin = this.page.margins.bottom;
            this.page.margins.bottom = 0
            this.fillColor('black')
                .moveTo(47, this.page.height - margins.bottom + 5)
                .lineTo(this.page.width - 47, this.page.height - margins.bottom + 5)
                .lineWidth(0.3).stroke()
            this.fillColor(normalColor)
                .text(`${this.companyInfo.name} ${this.companyInfo.legalStatus}`, margins.left, this.page.height - 65)
                .text(`SIREN ${this.companyInfo.siren} - SIRET ${this.companyInfo.siret} - VAT ${this.companyInfo.vat}`, margins.left, this.page.height - 50)
                .text(`${i + 1} / ${pages.count}`, 0, this.page.height - 50, { align: 'right' })
            this.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
        }
    }
}

export namespace PDF {
    export async function generate(mode: 'invoice' | 'quotation', source: any): Promise<Buffer> {

        if (!source) {
            throw new Error('Unknwon invoice')
        }

        if (!source.items.length) {
            throw new Error('Empty invoice')
        }

        const companyInfo = await prisma.companyInfo.findFirst()
        const bankAccount = await prisma.bankAccount.findFirst()

        return new Promise((resolve, reject) => {
            const pdf = new PDFGenerator(mode, companyInfo, bankAccount, source)

            const buffers = []
            pdf.on('data', buffers.push.bind(buffers))
            pdf.on('end', () => resolve(Buffer.concat(buffers)))
            pdf.end();
        })
    }
}