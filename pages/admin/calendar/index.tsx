import React, { useState } from "react"
import useSWR from "swr"
import { App } from "../../../context/AppContext"
import { getFetcher } from "../../../tools/fetcher"
import useCookie from "../../../hooks/useCookie"
import { Box, Button, Card, CardContent, CardHeader, Grid, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Tooltip, Typography } from "@mui/material"
import { DatePicker, MonthCalendar } from "@mui/x-date-pickers"
import { ChevronLeft, ChevronRight, NetworkWifiOutlined, Rectangle, Task } from "@mui/icons-material"
import Spinner from "../../../components/Spinner"
import dayjs from "dayjs"
import weekYear from 'dayjs/plugin/weekYear'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { prisma } from "../../../tools/db"
import { Invoice } from "../../../prisma/extensions"
import { useRouter } from "next/router"
import Link from "next/link"

dayjs.extend(weekOfYear)
dayjs.extend(weekYear)

export default function ({ customers }) {
    const router = useRouter()
    const { year, setYear, api } = App.useApp()
    const [month, depSetMonth, setMonth] = useCookie('calendar.selectedmonth', new Date().getMonth() + 1)
    const { data: invoices, error: error2, isLoading } = useSWR(`/api/invoices?y=${year}&m=${month}`, getFetcher, {})
    const { data: tasks, error, mutate } = useSWR(`/api/calendartasks?y=${year}&m=${month}`, getFetcher, {})
    const [selectedCustomer, depSetSelectedCustomer, setSelectedCustomer] = useCookie('calendar.selectedcustomer', customers[0].id)

    const next = async () => {
        setMonth(month == 12 ? 1 : month + 1)
        setYear(month == 12 ? year + 1 : year)
    }
    const prev = async () => {
        setMonth(month == 1 ? 12 : month - 1)
        setYear(month == 1 ? year - 1 : year)
    }

    App.useHeader('Calendar')
    App.useActions((
        <React.Fragment>
            <Button onClick={prev}><ChevronLeft /></Button>
            <Button disabled sx={{ width: 100 }}>{new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' })}</Button>
            <Button onClick={next}><ChevronRight /></Button>
            <Select
                sx={{ color: customers.find(c => c.id == selectedCustomer)?.color }}
                value={selectedCustomer}
                onChange={(event: SelectChangeEvent) => setSelectedCustomer(event.target.value)}
            >
                {customers.map((customer) => <MenuItem key={customer.id} value={customer.id} sx={{ color: customer.color }}>{customer.name}</MenuItem>)}
            </Select>
        </React.Fragment>
    ), [month, selectedCustomer, depSetSelectedCustomer, depSetMonth])

    if (error || error2) return null
    if (!invoices || !tasks) return <Spinner />

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    const sw = dayjs(start).week()

    const handleRemoveDay = async (day) => {
        const task = day.tasks.find(t => t.customerId == selectedCustomer)

        if (!task) {
            return
        }
        await api.calendarTask.delete(task.id)
        mutate()
    }
    const handleRemoveTask = async (task) => {
        await api.calendarTask.delete(task.id)
        mutate()
    }
    const handleAdd = async (day) => {
        if (day.disabled) {
            return
        }
        const task = day.tasks.find(t => t.customerId == selectedCustomer)
        if (task) {
            return
        }
        await api.calendarTask.create({ date: day.date, customerId: selectedCustomer })
        mutate()
    }
    const onWheel = async (event) => {
        if (event.deltaY > 0) next()
        else if (event.deltaY < 0) prev()
    }

    const weeksCount = Math.ceil((start.getDay() + end.getDate()) / 7)
    const weeks = Array.from(Array(weeksCount).keys()).map((i: number) => i + sw).map((w: number) => ({
        week: dayjs(start).week(w).week(),
        days: Array.from(Array(7).keys()).map((d: number) => {
            const date = dayjs(start).week(w).day(d).toDate()
            const dayOfWeek = dayjs(date).day()
            return {
                disabled: date < start || date > end,
                today: dayjs(date).isSame(new Date(), 'day'),
                weekend: dayOfWeek == 0 || dayOfWeek == 6,
                date,
                dayOfWeek: d,
                tasks: tasks.filter(task => dayjs(task.date).isSame(date, 'day')).map(task => ({
                    ...task,
                    customer: customers.find(c => c.id == task.customerId),
                })),
                invoices: invoices.filter(invoice => (Invoice.isImported(invoice) || Invoice.isLocked(invoice)) && dayjs(invoice.issueDate).isSame(date, 'day')),
            }
        })
    }))

    return (
        <React.Fragment>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }} onWheel={onWheel}>
                <Box sx={{ marginLeft: '30px', marginTop: 1 }}>
                    <Grid container spacing={1} sx={{ width: '100%' }}>
                        {Array.from(Array(7).keys()).map((d: number) => (
                            <Grid key={d} item xs={12 / 7}>
                                <Typography sx={{ textAlign: 'center', color: 'gray' }}>
                                    {dayjs(start).day(d).toDate().toLocaleDateString('default', { weekday: 'short' })}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
                <Box sx={{ flexGrow: 1, paddingTop: 1, paddingRight: 1 }}>
                    {weeks.map(week => (
                        <Box key={week.week} sx={{ height: `${100 / weeksCount}%` }} >
                            <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
                                <Box width={30} sx={{
                                    color: 'gray',
                                    writingMode: 'sideways-lr',
                                    alignSelf: 'center',
                                }} >
                                    {week.week}
                                </Box>
                                <Box sx={{ height: '100%', flexGrow: 1 }}>
                                    <Grid container spacing={1} sx={{ height: '100%' }}>
                                        {week.days.map(day => (
                                            <Grid item key={day.dayOfWeek} sx={{ width: `${100 / 7}%` }}>
                                                {!day.disabled &&
                                                    <Card
                                                        sx={{
                                                            height: '100%',
                                                            opacity: day.weekend ? 0.3 : 1,
                                                            border: day.today ? 1 : 0,
                                                            borderColor: day.today ? 'primary.main' : 'blue',
                                                            padding: 1,
                                                        }}
                                                        onClick={() => handleAdd(day)}
                                                        onContextMenu={e => { e.preventDefault(); handleRemoveDay(day) }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            width: '100%',
                                                            marginBottom: 1,
                                                        }}>
                                                            <Typography sx={{
                                                                flexGrow: 1,
                                                                textAlign: 'left',
                                                                color: day.today ? 'primary.main' : 'inherit',
                                                            }}>
                                                                {dayjs(day.date).format('DD')}
                                                            </Typography>

                                                            <Stack direction='row'>
                                                                {day.invoices.map(invoice => (
                                                                    <Tooltip
                                                                        key={crypto.randomUUID()}
                                                                        title={invoice.number}>
                                                                        <Link href={`/admin/invoices/${invoice.id}`}>
                                                                            <Task style={{ cursor: 'pointer', color: invoice.customer.color }} />
                                                                        </Link>
                                                                    </Tooltip>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                        <Stack spacing={1}>
                                                            {day.tasks.map(task => (
                                                                <Tooltip
                                                                    key={crypto.randomUUID()}
                                                                    title={task.customer.name}>
                                                                    <Box
                                                                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); handleRemoveTask(task) }}
                                                                        sx={{ width: '100%', height: '10px', background: task.customer.color }} />
                                                                </Tooltip>
                                                            ))}
                                                        </Stack>
                                                    </Card>}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Grid container spacing={2}>
                    {customers.map((customer) => <Grid item key={crypto.randomUUID()}>
                        <Grid container alignItems='center'>
                            <Grid item>
                                <Box
                                    sx={{ width: '20px', height: '5px', background: customer.color, verticalAlign: 'center' }} />
                            </Grid>
                            <Grid item>
                                {customer.name}
                            </Grid>
                        </Grid>
                    </Grid>)}
                </Grid>
            </Box>
        </React.Fragment >
    )
}

export async function getServerSideProps() {
    return App.validateJSON({
        props: {
            customers: await prisma.customer.findMany({ orderBy: { name: 'asc' } }),
        }
    })
}