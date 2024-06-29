import React from "react"
import useSWR from "swr"
import { App } from "../context/AppContext"
import { getFetcher } from "../tools/fetcher"
import useCookie from "../hooks/useCookie"
import { Box, Button, ButtonGroup, Card, Grid, MenuItem, Select, SelectChangeEvent, Stack, Tooltip, Typography } from "@mui/material"
import { ChevronLeft, ChevronRight, Task } from "@mui/icons-material"
import Spinner from "../components/Spinner"
import dayjs from "dayjs"
import weekYear from 'dayjs/plugin/weekYear'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { Invoice } from "../prisma/extensions"
import Link from "next/link"
import router from "next/router";

dayjs.extend(weekOfYear)
dayjs.extend(weekYear)

export default function MiniCalendar() {
    const [year] = React.useState(new Date().getFullYear())
    const [month] = React.useState(new Date().getMonth() + 1)
    const { data: tasks, error } = useSWR(`/api/calendartasks?y=${year}&m=${month}`, getFetcher, {})
    const { data: invoices, error: error2 } = useSWR(`/api/invoices?y=${year}&m=${month}`, getFetcher, {})
    const { data: customers, error: error3 } = useSWR('/api/customers', getFetcher, {})

    if (error || error2 || error3) return null
    if (!invoices || !tasks || !customers) return <Spinner />

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    const sw = dayjs(start).week()

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
            <Box sx={{ width: '100%', cursor: 'pointer' }}
                onClick={() => router.push('/admin/calendar')}
            >
                <Box sx={{ paddingTop: 0, paddingRight: 0 }}>
                    {weeks.map(week => (
                        <Box key={week.week} sx={{ height: `${100 / weeksCount}%` }} >
                            <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
                                <Box width={20} sx={{
                                    color: 'gray',
                                    writingMode: 'sideways-lr',
                                    alignSelf: 'center',
                                    fontSize: 12,
                                }} >
                                    {week.week}
                                </Box>
                                <Box sx={{ height: '100%', flexGrow: 1 }}>
                                    <Grid container sx={{ height: '100%' }}>
                                        {week.days.map(day => (
                                            <Grid item key={day.dayOfWeek} sx={{ width: `${100 / 7}%` }}>
                                                {!day.disabled &&
                                                    <Card
                                                        sx={{
                                                            height: '35px',
                                                            opacity: day.weekend ? 0.3 : 1,
                                                            border: day.today ? 1 : 0,
                                                            borderColor: day.today ? 'primary.main' : 'blue',
                                                            padding: '2px',
                                                            margin: '1px'
                                                        }}>
                                                        <Box sx={{
                                                            width: '100%',
                                                            marginBottom: 1,
                                                        }}>
                                                            <Typography sx={{
                                                                fontSize: 10,
                                                                textAlign: 'left',
                                                                color: day.today ? 'primary.main' : 'inherit',
                                                            }}>
                                                                {dayjs(day.date).format('DD')}
                                                            </Typography>
                                                        </Box>

                                                        <Stack spacing={0}>
                                                            {day.tasks.map(task => (<Box sx={{ width: '100%', height: '3px', background: task.customer.color }} />))}
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
            </Box>
        </React.Fragment >
    )
}