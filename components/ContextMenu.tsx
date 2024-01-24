import { MoreVert } from "@mui/icons-material";
import { IconButton, ListItemIcon, Menu, MenuItem } from "@mui/material";
import React from "react";

export type ContextMenuItem = {
    label?: string
    icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined
    onClick: () => void
}

type PropsType = {
    actions: Array<ContextMenuItem>
}

export default function ({ actions }: PropsType) {
    const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(menuAnchorEl)

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setMenuAnchorEl(null)
    }

    return (
        <React.Fragment>
            <IconButton aria-label="settings"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleMenuClick}>
                <MoreVert />
            </IconButton>

            <Menu
                id="long-menu"
                MenuListProps={{ 'aria-labelledby': 'long-button' }}
                anchorEl={menuAnchorEl}
                open={open}
                onClose={handleMenuClose} >
                {actions.map((action: ContextMenuItem) => (
                    <MenuItem key={crypto.randomUUID()} onClick={() => {
                        handleMenuClose()
                        action.onClick()
                    }}>
                        <ListItemIcon >
                            {action.icon}
                        </ListItemIcon>
                        {action.label}
                    </MenuItem>
                ))}
            </Menu>
        </React.Fragment>
    )
}