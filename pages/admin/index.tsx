import React from "react";
import useSWR from "swr";
import { getFetcher } from "../../tools/fetcher";
import Spinner from "../../components/Spinner";
import { App } from "../../context/AppContext";
import { Button, ButtonGroup, Card, CardContent, CardHeader, Grid, Stack } from "@mui/material";
import { Lock } from "@mui/icons-material";
import useCookie from "../../hooks/useCookie";

export default function () {
    const [period, depSetPeriod, setPeriod] = useCookie('selectedPeriod', 3);
    const { year } = App.useApp()
    const { data, error, isLoading } = useSWR(`/api/stats?y=${year}&period=${period}`, getFetcher, {})

    // App.useHeader('Dashboard')
    App.useActions((
        <ButtonGroup sx={{ margin: 0, height: '45px' }} variant="outlined">
            <Button disabled={period == 1} onClick={() => setPeriod(1)}>1</Button>
            <Button disabled={period == 2} onClick={() => setPeriod(2)}>2</Button>
            <Button disabled={period == 3} onClick={() => setPeriod(3)}>3</Button>
            <Button disabled={period == 4} onClick={() => setPeriod(4)}>4</Button>
            <Button disabled={period == 5} onClick={() => setPeriod(5)}>5</Button>
            <Button disabled={period == 6} onClick={() => setPeriod(6)}>6</Button>
            <Button disabled={period == 7} onClick={() => setPeriod(7)}>7</Button>
            <Button disabled={period == 8} onClick={() => setPeriod(8)}>8</Button>
            <Button disabled={period == 9} onClick={() => setPeriod(9)}>9</Button>
            <Button disabled={period == 10} onClick={() => setPeriod(10)}>10</Button>
            <Button disabled={period == 11} onClick={() => setPeriod(11)}>11</Button>
            <Button disabled={period == 12} onClick={() => setPeriod(12)}>Year</Button>
        </ButtonGroup>
    ), [period, depSetPeriod])

    if (error) return null
    if (!data) return <Spinner />

    const headerStyle = {
        alignSelf: 'center',
        color: 'gray',
        writingMode: 'sideways-lr',
        xs: 1,
    }

    return (
        <React.Fragment>
            <Grid container spacing={1} padding={1}>
                {data.map((item: any) => (
                    <Grid item key={crypto.randomUUID()} sx={{ width: '400px' }}>
                        <Card >
                            <CardHeader title={(<React.Fragment>
                                {item.name}{new Date() > new Date(item.end) && <Lock fontSize="small" sx={{ marginLeft: 1 }} />}
                            </React.Fragment>)}
                                subheader={`${new Date(item.start).toLocaleDateString()} - ${new Date(item.end).toLocaleDateString()}`} />
                            <CardContent>
                                <Stack spacing={2} sx={{ textAlign: 'right', margin: 0 }}>
                                    <Grid container>
                                        <Grid item xs={7}>Revenue</Grid>
                                        <Grid item xs={5}>{App.Format.amount(item.revenue)}</Grid>

                                        <Grid item xs={7}>Purchase</Grid>
                                        <Grid item xs={5}>{App.Format.amount(item.purchase)}</Grid>
                                    </Grid>

                                    <Grid container >
                                        <Grid item sx={headerStyle}>
                                            VAT
                                        </Grid>

                                        <Grid item xs={11} alignSelf='center'>
                                            <Grid container>
                                                <Grid item xs={6}>VAT In</Grid>
                                                <Grid item xs={6}>{App.Format.amount(item.vatIn)}</Grid>

                                                <Grid item xs={6}>VAT Out</Grid>
                                                <Grid item xs={6}>{App.Format.amount(item.vatOut)}</Grid>

                                                <Grid item xs={6}>VAT Result</Grid>
                                                <Grid item xs={6}>{App.Format.amount(item.vatResult)}</Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                    <Grid container direction='row' sx={{ minHeight: 50 }}>
                                        <Grid item sx={headerStyle}>TAXES</Grid>

                                        <Grid item xs={11} alignSelf='center'>
                                            <Grid container>
                                                {item.taxes.map(tax => (
                                                    <React.Fragment key={crypto.randomUUID()}>
                                                        <Grid item xs={6}>{tax.name}</Grid>
                                                        <Grid item xs={6}>{App.Format.amount(tax.value)}</Grid>
                                                    </React.Fragment>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </React.Fragment>
    )
}