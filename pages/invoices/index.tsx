import React from "react";
import useSWR from "swr";
import { getFetcher } from "../../tools/fetcher";
import Spinner from "../../components/Spinner";
import { App } from "../../context/AppContext";
import { Card, CardHeader, LinearProgress, Stack, Typography } from "@mui/material";
import { Check, Download, Preview } from "@mui/icons-material";
import { Invoice } from "../../prisma/extensions";
import dayjs from "dayjs";
import ContextMenu from "../../components/ContextMenu";

function InvoiceCard({ invoice }) {
    const { showPDFDialog } = App.useApp()
    const dayCnt = dayjs().diff(dayjs(invoice.executionDate), 'days')

    return (<React.Fragment>
        <Card>
            <CardHeader
                title={
                    <React.Fragment>
                        <Stack direction='row'>
                            {invoice.number}
                            {Invoice.isFullyPaid(invoice) &&
                                <Typography variant="h5" sx={{ color: 'green', marginTop: 0.5, marginLeft: 1 }}>
                                    <Check />
                                </Typography>
                            }
                            {!Invoice.isFullyPaid(invoice) && dayCnt > +invoice.paymentDelay
                                &&
                                <Typography variant="body2" sx={{ color: 'error.main', marginTop: 1, marginLeft: 1 }}>
                                    {dayCnt - +invoice.paymentDelay}d late
                                </Typography>
                            }

                        </Stack>
                    </React.Fragment>
                }
                subheader={`${App.Format.date(invoice.executionDate)} | ${App.Format.amount(invoice.total)}`}
                action={
                    <ContextMenu actions={[
                        { label: 'Preview', icon: <Preview />, onClick: () => showPDFDialog({ url: `/api/documents/${invoice.attachmentId}`, allowDismiss: true }) },
                        { label: 'Download', icon: <Download />, onClick: () => App.download(`/api/documents/${invoice.attachmentId}`) },

                    ]} />
                } />
            {!Invoice.isFullyPaid(invoice) && dayCnt <= +invoice.paymentDelay &&
                <Stack direction='row' padding={2}>
                    <React.Fragment>
                        <LinearProgress value={dayCnt * 100 / invoice.paymentDelay} sx={{ minWidth: 50, mr: 1, flexGrow: 1, verticalAlign: 'center', marginTop: 1.4 }} variant="determinate" />
                        <Typography variant="body1" sx={{}}>
                            {dayCnt}/{invoice.paymentDelay}d
                        </Typography>

                    </React.Fragment>
                </Stack>
            }
        </Card>
    </React.Fragment>)
}

export default function Invoices() {
    const { data, error, isLoading } = useSWR(`/api/invoices`, getFetcher, {})

    if (error) return null
    if (!data) return <Spinner />

    return (
        <React.Fragment>
            <Stack margin={1} spacing={1}>
                {data.map((invoice: Invoice) => <InvoiceCard key={crypto.randomUUID()} invoice={invoice} />)}
            </Stack>
        </React.Fragment>
    );
}