import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import React from "react";
import { AlertAction, DialogOptions } from "../context/DialogBoxContext";

type PropsType = {
    options: DialogOptions,
    onClick: (value?: AlertAction | undefined) => void,
}

export default function ({ options, onClick }: PropsType) {
    return (
        <React.Fragment>
            <Dialog
                fullWidth
                maxWidth={false}
                scroll="paper"
                open
                onClose={() => options.allowDismiss && onClick()}
            >
                {options.title &&
                    <DialogTitle id="alert-dialog-title">
                        {options.title}
                    </DialogTitle>
                }
                <DialogContent dividers sx={{
                    flexGrow: 1,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0
                }}>
                    <embed
                        style={{ width: '100%', height: '100%' }}
                        type='application/pdf'
                        src={options.url}
                    />
                </DialogContent>
                {options.actions &&
                    <DialogActions>
                        {
                            options.actions?.map((action: AlertAction) => (
                                <Button key={action.caption} onClick={() => onClick(action)}>{action.caption}</Button>
                            ))
                        }
                    </DialogActions>
                }
            </Dialog>
        </React.Fragment>
    )
}