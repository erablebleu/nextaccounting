import React, { ReactElement } from 'react';
import { AppBar, Box, ButtonGroup, Divider, Drawer, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { App } from '../context/AppContext';
import Menu, { adminMenu, userMenu } from './Menu';
import ProfileButton from './ProfileButton';
import YearSelector from './YearSelector';
import MiniCalendar from './MiniCalendar';

interface Props {
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window?: () => Window;
}

export function noLayout(page: ReactElement) {
    return (
        <React.Fragment>
            {page}
        </React.Fragment>
    )
}

export default function Layout({ children }, props: Props) {
    const { window } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { session, header, formActions } = App.useApp()

    const container = window !== undefined ? () => window().document.body : undefined
    const drawerWidth = session ? 240 : 0

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const getMenu = () => {
        switch (session?.role) {
            case 'ADMIN': return adminMenu
            case 'USER': return userMenu
            default: return undefined
        }
    }

    const menu = getMenu()

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar>
            </Toolbar>
            <Divider />
            {menu && <React.Fragment>
                <Menu data={getMenu()} />
                <Divider />
            </React.Fragment>}
            <Box sx={{ flexGrow: 1 }} />
            {session?.role == "ADMIN" && <React.Fragment>
                <MiniCalendar />
                <YearSelector />
            </React.Fragment>}
        </Box>
    )

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar style={{ paddingLeft: '8px', paddingRight: '5px' }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <ButtonGroup sx={{ margin: 0, height: '45px' }} variant="outlined">
                        {formActions}
                    </ButtonGroup>

                    <Box component="div" sx={{ flexGrow: 1 }}>
                        <Typography variant='h5' align={formActions ? 'center' : 'left'}>
                            {header?.toUpperCase()}
                        </Typography>
                    </Box>

                    <ProfileButton />
                </Toolbar>
            </AppBar>
            {session &&
                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                    <Drawer
                        container={container}
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >

                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>
            }

            <Box sx={{ display: 'block' }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    width: { sm: `calc(100% - ${drawerWidth}px)`, xs: '100%' },
                    position: 'fixed',
                    overflowY: 'auto',
                }}>
                    <Toolbar />
                    {children}
                </Box>
            </Box>
        </Box>
    )
}