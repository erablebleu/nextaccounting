import React from 'react';
import { Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AccountBalance, CalendarMonth, Description, Euro, Home, ImportExport, InsertDriveFile, Mail, RequestPage, Settings, Shop, SwapVert, Task } from '@mui/icons-material';
import { App } from '../context/AppContext';

export type MenuInfo = {
    text?: string;
    href?: string;
    divider?: Boolean;
    icon?: React.JSX.Element;
};

export const adminMenu: Array<MenuInfo> = [
    { text: 'Dashboard', href: '/admin', icon: <Home /> },
    {},
    { text: 'Invoices', href: '/admin/invoices', icon: App.Icons.Invoice },
    { text: 'Quotations', href: '/admin/quotations', icon: App.Icons.Quotation },
    {},
    { text: 'Purchases', href: '/admin/purchases', icon: App.Icons.Purchase },
    { text: 'Revenues', href: '/admin/revenues', icon: App.Icons.Revenue },
    {},
    // { text: 'Taxes', href: '/admin/taxes', icon: App.Icons.Tax },
    // {},
    // { text: 'Bank Accounts', href: '/admin/bankaccounts', icon: App.Icons.BankAccount },
    { text: 'Bank Transactions', href: '/admin/banktransactions', icon: App.Icons.BankTransaction },
    {},
    { text: 'Calendar', href: '/admin/calendar', icon: <CalendarMonth/> },
    {},
    // { text: 'Customers', href: '/admin/customers', icon: App.Icons.Customer },
    // { text: 'Contacts', href: '/admin/contacts', icon: App.Icons.Contact },
    // {},
    { text: 'Files', href: '/files', icon: App.Icons.File },
    // {},
    // { text: 'Settings', href: '/admin/companyinfo', icon: <Settings/> },
];

export const userMenu: Array<MenuInfo> = [
    { text: 'Invoices', href: '/invoices', icon: App.Icons.Invoice },
    { text: 'Files', href: '/files', icon: App.Icons.File },
];

export default function Menu({ data }) {
    const router = useRouter()

    return (
        <React.Fragment>
            <List>
                {data.map((item: MenuInfo) => (
                    (item.text && item.href)
                        ? <ListItem key={crypto.randomUUID()} disablePadding>
                            <ListItemButton href={item.href} component={Link} 
                                selected={ (item.href == '/' || item.href == '/admin' ) ? router.asPath == item.href : router.asPath.startsWith(item.href)} >
                                {item.icon
                                    ? <ListItemIcon> {item.icon} </ListItemIcon>
                                    : null}
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                        : <Divider key={crypto.randomUUID()} sx={{ margin: 1}} />
                ))}
            </List>
        </React.Fragment>
    )
}