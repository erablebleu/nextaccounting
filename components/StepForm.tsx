import { Cancel, Check, ChevronLeft, ChevronRight, Close } from "@mui/icons-material";
import { Box, Button, ButtonGroup, Card, CardHeader, CircularProgress, Grid, IconButton } from "@mui/material";
import React from "react";

type Step = {
    body: HTMLElement,
    canValidate?: () => void
}

type StepFormPropsType = {
    children?: any,
    onCancel?: () => void
    onValidate?: () => void
    steps?: Array<Step>
}

export default function ({ children, onCancel, onValidate, steps }: StepFormPropsType) {
    const [step, setStep] = React.useState(0)
    const maxStep = children.length
    const firstStep = step == 0
    const lastStep = step == maxStep - 1

    return (
        <Card>
            <CardHeader
                title='salut'
                action={
                    <React.Fragment>
                        <ButtonGroup>
                            <Button
                                disabled={firstStep && !onCancel}
                                onClick={firstStep ? onCancel : () => setStep(() => step - 1)}>
                                {(firstStep && onCancel) ? <Close /> : <ChevronLeft />}
                            </Button>
                            <Button
                                color={lastStep ? 'success' : 'primary'}
                                onClick={lastStep ? onValidate : () => setStep(() => step + 1)}>
                                {lastStep ? <Check /> : <ChevronRight />}
                            </Button>
                        </ButtonGroup>
                    </React.Fragment>
                }
            />
            <Box padding={1}>
                {children[step]}
            </Box>
        </Card>
    )
}