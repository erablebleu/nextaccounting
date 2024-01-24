import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { App } from '../context/AppContext';

export default function () {    
    const { year, setYear } = App.useApp()

    return (
        <React.Fragment>
            <Box margin={1} sx={{ display: 'flex', flexDirection: 'row' }}>

                <Button
                    variant='outlined'
                    onClick={() => setYear(year - 1)}
                    disabled={year == 2000}
                >
                    <ChevronLeft/>
                </Button>

                <Typography variant='h5' color='primary' ml={1} mr={1} align='center' sx={{ flexGrow: 1, userSelect: 'none' }}>
                    {year}
                </Typography>

                <Button
                    variant='outlined'
                    onClick={() => setYear(year + 1)}
                    disabled={year == new Date().getFullYear()}>
                    <ChevronRight/>
                </Button>

            </Box>
        </React.Fragment >
    );
}