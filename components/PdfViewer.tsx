import React from 'react';
import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import Link from 'next/link';

export default function PdfViewer({ uri }) {
    return (
        <React.Fragment>
            <Box sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}>
                <embed
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    type='application/pdf'
                    src={uri}
                />
            </Box>
        </React.Fragment>
    )
}