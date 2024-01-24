import { Box, CircularProgress, Grid } from "@mui/material";

export default function Spinner() {
    return (
        <Grid sx={{
            minWidth: "100%",
            minHeight: "80vh",
            display: 'flex',
            flexDirection: "column",
            justifyContent: "center"
        }}>
            <Box sx={{
                display: 'flex',
                justifyContent: "center",
                spacing: 0,
                alignItems: "center",
                justify: "center",
            }}>
                <CircularProgress />
            </Box>
        </Grid>)
}