import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Avatar, Box, Divider, IconButton, ListItemIcon, useColorScheme } from '@mui/material';
import { Login, Logout, Settings } from '@mui/icons-material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { UserRole } from '@prisma/client';
import { MenuInfo } from './Menu';
import { App } from '../context/AppContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const adminMenu: Array<MenuInfo> = [
    { text: 'Taxes', href: '/admin/taxes', icon: App.Icons.Tax },
    { text: 'Bank Accounts', href: '/admin/bankaccounts', icon: App.Icons.BankAccount },
    { text: 'Customers', href: '/admin/customers', icon: App.Icons.Customer },
    { text: 'Contacts', href: '/admin/contacts', icon: App.Icons.Contact },
    { text: 'Company Info', href: '/admin/companyinfo', icon: <Settings /> },
];

export default function ProfileButton() {
    const router = useRouter()
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const [hydrated, setHydrated] = React.useState(false);
    const { data: session } = useSession();
    const { mode, setMode } = useColorScheme();

    React.useEffect(() => {
        setHydrated(true);
    }, [])

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (anchorElUser)
            setAnchorElUser(null)
        else
            setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null)
    };

    return (
        <React.Fragment>
            <Box sx={{ mr: 2 }}>
                {session?.user?.email}
            </Box>
            <Box sx={{ flexGrow: 0 }}>
                <IconButton onClick={handleOpenUserMenu}>
                    <Avatar alt={session?.user?.email ?? undefined} src={session?.user?.image ?? undefined}></Avatar>
                </IconButton>
                <Menu
                    sx={{
                        mt: '50px',
                        transform: 'translateX(21px)',
                    }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                >
                    {hydrated &&
                        <MenuItem
                            onClick={() => {
                                setMode(mode === 'light' ? 'dark' : 'light');
                            }} color="inherit">
                            <ListItemIcon>
                                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </ListItemIcon>
                            {mode === 'dark' ? 'Light' : 'Dark'} Mode
                        </MenuItem>
                    }
                    {session?.role == UserRole.ADMIN && <Divider />}
                    {session?.role == UserRole.ADMIN &&
                        adminMenu.map(item => (item.text && item.href) ? (
                            <MenuItem key={item.href} href={item.href} component={Link} onClick={() => handleCloseUserMenu()} >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                {item.text}
                            </MenuItem>
                        ) : <Divider />)
                    }

                    <Divider />

                    {!session &&
                        <MenuItem href='auth/signin' onClick={() => { signIn(); handleCloseUserMenu(); }}>
                            <ListItemIcon>
                                <Login fontSize="small" />
                            </ListItemIcon>
                            Login
                        </MenuItem>
                    }
                    {session &&
                        <MenuItem onClick={() => { signOut({redirect: true, callbackUrl: '/'}); handleCloseUserMenu(); }}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    }
                </Menu>
            </Box>
        </React.Fragment >
    );
}