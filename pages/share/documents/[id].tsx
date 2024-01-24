import React, { ReactElement } from "react"
import { prisma } from "../../../tools/db"
import { Box, Button, Card, CardHeader, Grid, LinearProgress, Stack, Typography } from "@mui/material"
import { Cancel, Check, Download, Link, Mail } from "@mui/icons-material"
import { App } from "../../../context/AppContext"
import { useRouter } from "next/router"
import { Invoice } from "../../../prisma/extensions"
import { Prisma } from "@prisma/client"
import dayjs from "dayjs"
import { noLayout } from "../../../components/Layout"
import { useFirstRender } from "../../../hooks/useFirstRender"
import { decrypt } from "../../../tools/crypto"
import { QuotationState } from "../../../tools/enums"

function ButtonLine({ onClick, label, icon }) {
    return (
        <Button sx={{ width: '100%' }} onClick={onClick}>
            {label}
            <Box sx={{ flexGrow: 1 }} />
            {icon}
        </Button>
    )
}
function Section({ children, title, padding = 2 }: { children: any, title: any, padding?: number }) {
    return (
        <Card>
            <CardHeader
                subheader={title} />
            <Box padding={padding} paddingTop={0}>
                {children}
            </Box>
        </Card>
    )
}
function Column({ children, sx }: { children, sx?}) {
    return (
        <Grid item sx={sx}>
            <Stack spacing={1}>
                {children}
            </Stack>
        </Grid>
    )
}
function ValueLine({ label, value }) {
    return (
        <Grid alignItems="flex-end" container direction="row" >
            <Grid item sx={{ marginRight: 3 }}>
                <Typography fontSize={14} sx={{}} >
                    {label}
                </Typography>
            </Grid>

            <Grid item sx={{ flexGrow: 1 }}>
                <Typography color="primary" fontWeight="bold" textAlign="right">
                    {value}
                </Typography>
            </Grid>
        </Grid>
    )
}

function InvoiceColumn({ companyName, invoice }) {
    const total = Prisma.Decimal.sum(invoice.total, invoice.totalVAT)
    const fullyPaid = total.eq(invoice.paid)
    const dayCnt = dayjs().diff(dayjs(invoice.date), 'days')
    const late = dayCnt > +invoice.paymentDelay

    return (<React.Fragment>
        <Column sx={{ minWidth: '260px' }}>
            <Section title="Company">
                <Typography color="primary" fontWeight="bold" textAlign="right">
                    {companyName}
                </Typography>
            </Section>
            <Section title="Informations">
                <ValueLine label="Number" value={invoice.number} />
                <ValueLine label="Customer" value={invoice.customer} />
                <ValueLine label="Execution" value={App.Format.date(invoice.date)} />
                <ValueLine label="Total" value={App.Format.amount(invoice.total)} />
                <ValueLine label="VAT" value={App.Format.amount(invoice.totalVAT)} />
                <ValueLine label="Total w. VAT" value={App.Format.amount(total)} />
            </Section>
            <Section title={(<React.Fragment>
                <Grid container>
                    <Grid item sx={{ flexGrow: 1 }}>
                        Payment
                    </Grid>
                    {fullyPaid &&
                        <Grid item >
                            <Check color="success" />
                        </Grid>}
                </Grid>
            </React.Fragment>
            )}>
                <Grid alignItems="flex-end" justifyContent="flex-end" container direction="row" >
                    <Grid item>
                        <Typography color="primary" fontWeight="bold" textAlign="right">
                            {App.Format.amount(invoice.paid)}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography sx={{ marginLeft: 1 }}>
                            / {App.Format.amount(total)}
                        </Typography>
                    </Grid>
                </Grid>
                <LinearProgress value={100 * +invoice.paid / (+invoice.total + +invoice.totalVAT)} variant="determinate" />
            </Section>
            {!fullyPaid &&
                <Section title="Delay">
                    <Grid container justifyContent="flex-end" flexGrow={1} >
                        {late ?
                            <Typography color="error.main" >
                                {dayCnt - +invoice.paymentDelay}d late
                            </Typography>
                            :
                            <Typography color="primary">
                                {dayCnt}/{invoice.paymentDelay}d
                            </Typography>
                        }
                    </Grid>
                    <LinearProgress value={Math.min(dayCnt, +invoice.paymentDelay) * 100 / +invoice.paymentDelay} variant="determinate" />
                </Section>
            }
        </Column>
    </React.Fragment>)
}

function QuotationColumn({ companyName, quotation }) {
    const total = Prisma.Decimal.sum(quotation.total, quotation.totalVAT)
    const dayCnt = dayjs().diff(dayjs(quotation.date), 'days')
    const late = dayCnt > +quotation.validity

    return (<React.Fragment>
        <Column sx={{ minWidth: '260px' }}>
            <Section title="Company">
                <Typography color="primary" fontWeight="bold" textAlign="right">
                    {companyName}
                </Typography>
            </Section>
            <Section title="Informations">
                <ValueLine label="Number" value={quotation.number} />
                <ValueLine label="Customer" value={quotation.customer} />
                <ValueLine label="Date" value={App.Format.date(quotation.date)} />
                <ValueLine label="Total" value={App.Format.amount(quotation.total)} />
                <ValueLine label="VAT" value={App.Format.amount(quotation.totalVAT)} />
                <ValueLine label="Total w. VAT" value={App.Format.amount(total)} />
            </Section>
            {!quotation.accepted && !quotation.denied &&
                <Section title={(<React.Fragment>
                    <Grid container>
                        <Grid item sx={{ flexGrow: 1 }}>
                            Validity
                        </Grid>
                    </Grid>
                </React.Fragment>
                )}>
                    <React.Fragment>
                        <Grid container justifyContent="flex-end" flexGrow={1} >
                            <Typography color="primary">
                                {dayCnt}/{quotation.validity}d
                            </Typography>
                        </Grid>
                        <LinearProgress value={Math.min(dayCnt, +quotation.validity) * 100 / +quotation.validity} variant="determinate" />
                    </React.Fragment>

                </Section>
            }
            {quotation.accepted &&
                <Section title={(<React.Fragment>
                    <Grid container>
                        <Grid item sx={{ flexGrow: 1 }}>
                            Accepted
                        </Grid>
                        <Grid item >
                            <Check color="success" />
                        </Grid>
                    </Grid>
                </React.Fragment>
                )}>
                </Section>
            }
            {quotation.denied &&
                <Section title={(<React.Fragment>
                    <Grid container>
                        <Grid item sx={{ flexGrow: 1 }}>
                            Denied
                        </Grid>
                        <Grid item >
                            <Cancel color="error" />
                        </Grid>
                    </Grid>
                </React.Fragment>
                )}>
                </Section>
            }
        </Column>
    </React.Fragment>)
}

export default function Documents({ companyName, companyMail, invoice, quotation }) {
    const router = useRouter()
    const { defaultErrorHandler, copyToClipboard } = App.useApp()
    const [id, setId] = React.useState<string | undefined>(undefined)

    useFirstRender(() => {
        setId(router.query.id as string)
    })
    console.log(invoice.number)
    console.log(quotation.number)
    return (
        <React.Fragment>
            <Box sx={{ margin: 2, height: '100vh' }}>
                <Grid container spacing={2} sx={{ height: '100%' }}>
                    {invoice.number && <InvoiceColumn companyName={companyName} invoice={invoice} />}
                    {quotation.number && <QuotationColumn companyName={companyName} quotation={quotation} />}
                    <Card sx={{ margin: 2, marginRight: 0, flexGrow: 1 }}>
                        {id && <embed
                            style={{ width: '100%', height: '100%' }}
                            type='application/pdf'
                            src={`/api/documents/${id}`}
                        />}
                    </Card>
                    <Column sx={{ width: '250px' }}>
                        <Section title="Actions" padding={1} >
                            <ButtonLine label="Download" icon={<Download />} onClick={() => App.download(`/api/documents/${id}`, defaultErrorHandler)} />
                            <ButtonLine label="Copy Public Link" icon={<Link />} onClick={() => copyToClipboard(window.location.toString())} />
                            {companyMail && <ButtonLine label="Contact" icon={<Mail />} onClick={() => App.sendMail(companyMail)} />}
                        </Section>
                    </Column>
                </Grid>
            </Box>
        </React.Fragment>
    )
}

Documents.getLayout = noLayout

export async function getServerSideProps(context) {
    const id = decrypt(context.params.id)
    const companyInfo = await prisma.companyInfo.findFirst()
    const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
            shareLink: true,
            invoice: { include: { revenues: true, customer: true } },
            quotation: { include: { customer: true } },
        }
    })

    if (!attachment?.shareLink || attachment.shareLink.validity && attachment.shareLink.validity < new Date()) {
        return {
            redirect: {
                destination: '/api/auth/signin',
                permanent: false,
            },
        }
    }

    return App.validateJSON({
        props: {
            companyName: companyInfo?.name,
            companyMail: companyInfo?.mail,
            invoice: {
                number: attachment.invoice?.number,
                customer: attachment.invoice?.customer.name,
                total: attachment.invoice?.total,
                totalVAT: attachment.invoice?.totalVAT,
                date: attachment.invoice?.executionDate,
                paymentDelay: attachment.invoice?.paymentDelay,
                paid: attachment.invoice ? Invoice.paidPart(attachment.invoice) : 0,
            },
            quotation: {
                number: attachment.quotation?.number,
                customer: attachment.quotation?.customer.name,
                total: attachment.quotation?.total,
                totalVAT: attachment.quotation?.totalVAT,
                date: attachment.quotation?.issueDate,
                validity: attachment.quotation?.validity,
                denied: attachment.quotation?.state == QuotationState.DENIED,
                accepted: attachment.quotation?.state == QuotationState.ACCEPTED,
            }
        }
    })
}