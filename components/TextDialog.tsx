import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
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
                open
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                onClose={() => options.allowDismiss && onClick()}
            >
                <DialogTitle id="alert-dialog-title">
                    {options.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {options.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {
                        options.actions?.map((action: AlertAction) => (
                            <Button key={action.caption} onClick={() => onClick(action)}>{action.caption}</Button>
                        ))
                    }
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}